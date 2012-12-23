var OverviewView = Backbone.View.extend({
  initialize: function(event) {
    this.render(event);
  },

  events: {
    'click #connect-button': 'connect',
    'click #connect-more-options-button': 'more_options',
    'click #login-button': 'login_register',
    'click #register-button': 'login_register',
    'keypress': 'connectOnEnter',
    'click #connect-secure': 'toggle_ssl_options'
  },

  el: '.content',

  render: function(event) {
    var html = ich.overview(),
        is_modal = (event !== undefined && event.modal === true);
    // Navigation to different overview panes
    if (event === undefined) {
      html.html(ich.overview_home());
    } else {
      var func = ich['overview_' + event.currentTarget.id];
      html.html(func({'loggedIn': irc.loggedIn}));
    }
    $('.overview_button', html).bind('click', $.proxy(this.render, this));
    $('#close', html).bind('click', function() { $('#modal').fadeOut(); });
    
    if (is_modal !== true) {
      $(this.el).html(html);
    } else {
      var modal = $('#modal');
      modal.html(html);
      for (var bind_event in this.events) {
        var bind_function = $.proxy(this[this.events[bind_event]], this),
            bind_split = bind_event.split(' ');
        if (bind_split.length == 2) {
          $(bind_split[1], modal).bind(bind_split[0], bind_function);
        } else {
          $(modal).bind(bind_split[0], bind_function);
        }
      }
      modal.fadeIn();
    }
    
    return this;
  },

  connectOnEnter: function(event) {
    if (event.keyCode !== 13) return;
    if($('#connect-button').length){
      this.connect(event);
    }
    if($('#login-button').length){
      event.action= 'Login';
      this.login_register(event);
    }
    if($('#register-button').length){
      event.action = 'Register';
      this.login_register(event);
    }
  },

  connect: function(event) {
    event.preventDefault();
    $('.error').removeClass('error');

    var server = $('#connect-server').val(),
    nick = $('#connect-nick').val(),
    port = $('#connect-port').val(),
    away = $('#connect-away').val(),
    realName = $('#connect-realName').val() || nick,
    secure = $('#connect-secure').is(':checked'),
    selfSigned = $('#connect-selfSigned').is(':checked'),
    rejoin = $('#connect-rejoin').is(':checked'),
    password = $('#connect-password').val(),
    encoding = $('#connect-encoding').val(),
    keepAlive = false;
    
    if (!server) {
      $('#connect-server').closest('.control-group').addClass('error');
    }
    
    if (!nick) {
      $('#connect-nick').closest('.control-group').addClass('error');
    }

    if (irc.loggedIn && $('#connect-keep-alive').length) {
      keepAlive = $('#connect-keep-alive').is(':checked');
    }
    
    if (nick && server) {
      $('form').append(ich.load_image());
      $('#connect-button').addClass('disabled');

      var connectInfo = {
        nick: nick,
        server: server,
        port: port,
        secure: secure,
        selfSigned: selfSigned,
        rejoin: rejoin,
        away: away,
        realName: realName,
        password: password,
        encoding: encoding,
        keepAlive: keepAlive
      };

      irc.me = new User(connectInfo);
      irc.me.on('change:nick', irc.appView.renderUserBox);
      irc.socket.emit('connect', connectInfo);
    }
  },

  more_options: function() {
    if (typeof this.$el !== 'undefined')
      this.$el.find('.connect-more-options').toggleClass('hide');
    else
      $('#overview .connect-more-options').toggleClass('hide');
  },

  login_register: function(event) {
    var action = event.target.innerHTML.toLowerCase() || event.action.toLowerCase();
    event.preventDefault();
    $('.error').removeClass('error');

    var username = $('#' + action + '-username').val();
    var password = $('#' + action + '-password').val();
 
    if (!username) {
      $('#' + action + '-username').closest('.clearfix').addClass('error');
      $('#' + action + '-username').addClass('error');
    }
    
    if (!password) {
      $('#' + action + '-password').closest('.clearfix').addClass('error');
      $('#login-password').addClass('error');
    }
    
    if(username && password){
      $('form').append(ich.load_image());
      $('#' + action + '-button').addClass('disabled');
    }

    irc.socket.emit(action, {
      username: username,
      password: password
    });
  },

  toggle_ssl_options: function(event) {
    var port = $('#connect-secure').is(':checked') ? 6697 : 6667 ;
    $('#connect-port').attr('placeholder', port);
    $('#ssl-self-signed').toggle();
  }
});
