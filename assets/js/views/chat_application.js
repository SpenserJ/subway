var ChatApplicationView = Backbone.View.extend({
  className: 'container-fluid',
  originalTitle: document.title,

  events: {
    'click #new_connection': 'new_connection'
  },

  new_connection: function() {
    var view = new OverviewView({ currentTarget: { id: 'connection' }, modal: true });
  },

  initialize: function() {
    irc.chatWindows.bind('change:unread', this.showUnread, this)
      .bind('change:unreadMentions', this.showUnread, this)
      .bind('forMe', this.playSound, this);


    // Preload sound files
    if (this._supportedFormat) {
      this.sounds = {
        newPm: this._loadSound('new-pm'),
        message: this._loadSound('msg')
      };
    }

    // Detect window focus so new message alerts come in
    // when window is not focused, even on current tab
    var blurTimer, activeChat;
    $(window).blur(function() {
      blurTimer = setTimeout(function() {
        // Only assign if there's currently an active window
        // Guards against losing activeChat if there's a second blur event
        activeChat = irc.chatWindows.getActive() ?
                     irc.chatWindows.getActive() :
                     activeChat;
        if (activeChat && activeChat.set) { activeChat.set('active', false); }
      }, 1000);
    }).focus(function() {
      clearTimeout(blurTimer);
      if(activeChat && activeChat.set) { activeChat.set('active', true); }
    });

    this.render(true);
  },

  overview: null,

  render: function(initializing) {
    var body = $(this.el).html(ich.chat_application());
    $('body').html(body);
    if (initializing === undefined || initializing === false)
      this.renderServerBox();
    $('#new_connection').bind('click', this.new_connection);
    if (!irc.connected) {
      this.overview = new OverviewView;
    } else {
      this.channelList = new ChannelListView;
    }
    return this;
  },

  // Net connection error
  showError: function(text) {
    $('#loading_image').remove();
    $('.btn').removeClass('disabled');
    $('#home_parent').after(ich.alert({
      type: 'alert-error',
      content: text
    }).alert());
  },

  renderServerBox: function() {
    // As we may be rendering the server box before the server is connected,
    // check our status, and predefine server_box_info if necessary
    var server_box_info = (irc.me !== undefined) ?
            irc.me.toJSON() :
            { nick: 'Connecting', server: irc.hostname },
        $server_box = $('#' + irc.connection_id);
    
    server_box_info.connection_id = irc.connection_id;
    var rendered = ich.server_box(server_box_info);
    
    // disconnect server handler
    $('#' + irc.connection_id + ' .close-button', rendered).click(function() {
      irc.socket.emit('disconnectServer');
    });
    
    if ($server_box.length === 0) {
      $(rendered).appendTo('#connections');
    } else {
      $('.channels', rendered).replaceWith($('.channels', $server_box));
      $server_box.replaceWith(rendered);
    }
  },

  // Show number of unread mentions in title
  showUnread: function() {
    var unreads = irc.chatWindows.unreadCount();
    if (unreads > 0)
      document.title = '(' + unreads + ') ' + this.originalTitle;
      if( window.unity.connected ) {
        window.unity.api.Launcher.setCount(unreads);
        window.unity.api.Launcher.setUrgent(true);
      }
    else
      document.title = this.originalTitle;
      if( window.unity.connected ) {
        window.unity.api.Launcher.clearCount();
        window.unity.api.Launcher.setUrgent(false);
      }
  },

  playSound: function(type) {
    this.sounds && this.sounds[type].play();
  },

  _loadSound: function(name) {
    var a = new Audio();
    a.src = '/assets/sounds/' + name + '.' + this._supportedFormat();
    return a;
  },

  // Detect supported HTML5 audio format
  _supportedFormat: function() {
    var a = document.createElement('audio');
    if (!a.canPlayType) return false;
    else if (!!(a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '')))
      return 'ogg'
    else if (!!(a.canPlayType('audio/mpeg;').replace(/no/, '')))
      return 'mp3'
  }
});
