RdioTrack = Backbone.Model.extend({});

SoundCloudTrack = Backbone.Model.extend({});

SoundCloudTrackCollection = Backbone.Collection.extend({
  model: SoundCloudTrack
});

SoundCloudTrackListItemView = Backbone.View.extend({
  template: _.template($('#soundcloud-track-template').html()),

  events: {
    'click .soundcloud-play-btn': 'playTrack'
  },

  playTrack: function() {
    var track_url = this.model.get('permalink_url');
    SC.oEmbed(track_url, { auto_play: true }, function(oEmbed) {
      $('#soundcloud-embed').html(oEmbed.html);
      R.player.pause();
    });
  },

  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  }

});

SoundCloudTrackListView = Backbone.View.extend({
  el: $('#soundcloud-track-list'),

  initialize: function() {
    this.listenTo(this.model, 'reset', this.render);
    this.listenTo(this.options.rdioTrack, 'change', this.newSearch);
  },

  newSearch: function() {
    var self = this;
    var query = this.options.rdioTrack.get('artist') + " " + this.options.rdioTrack.get('name') + " remix"

    console.log('Searching SoundCloud for', query)

    SC.get('/tracks', {
        q: query,
        filter: 'streamable',
        order: 'hotness'
      }, function(tracks) {
        var filteredTracks = _.filter(tracks, function(track) {
          return track.title.toLowerCase().indexOf('remix') > -1
        })
        self.model.reset(filteredTracks);
    });
  },

  render: function() {
    var self = this;

    this.$el.empty();
    this.model.each(function (track) {
      self.$el.append(new SoundCloudTrackListItemView({
        model: track
      }).render().el)
    });

    return this;
  }

});

RdioTrackView = Backbone.View.extend({
  el: $('#rdio-track'),

  template: _.template($('#rdio-track-template').html()),

  initialize: function() {
    this.listenTo(this.model, 'change', this.render);
  },

  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  }
});

var getPlayingTrackInfo = function() {
  var playingTrack = R.player.playingTrack();
  if (playingTrack) {
    return playingTrack.attributes;
  } else {
    return {}
  }
}


var main = function() {
  if (!rdioUtils.startupChecks()) {
    return;
  }

  SC.initialize({
    client_id: 'a73e746e680048b6dd2340e81a126ba8'
  });

  var rdioTrack = new RdioTrack;
  var rdioTrackView = new RdioTrackView({
    model: rdioTrack
  });

  var soundCloudTrackCollection = new SoundCloudTrackCollection;
  var trackView = new SoundCloudTrackListView({
    model: soundCloudTrackCollection,
    rdioTrack: rdioTrack,
  });

  R.ready(function() {
    rdioUtils.authWidget($('#authenticate'));

    rdioTrack.set(getPlayingTrackInfo());
    R.player.on('change:playingTrack', function() {
      rdioTrack.set(getPlayingTrackInfo());
    });
  });
}

main();
