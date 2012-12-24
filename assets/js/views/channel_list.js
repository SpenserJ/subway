var ChannelListView = Backbone.View.extend({
  initialize: function() {
    this.el = '#' + irc.connection_id + ' .channels';
    irc.chatWindows.bind('add', this.addChannel, this);
    this.channelTabs = []
  },

  addChannel: function(chatWindow) {
    var view = new ChannelTabView({model: chatWindow});
    this.channelTabs.push(view);
    $(this.el).append(view.render().el);

    var name = chatWindow.get('name');
    if(name[0] === '#' || name === 'status'){
      view.setActive();
    }
  }
});
