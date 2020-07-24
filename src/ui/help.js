

class SmoHelp {

  static displayHelp() {
    $('body').addClass('showHelpDialog');
    $('.helpDialog').html('');
    var b = htmlHelpers.buildDom;
    SmoHelp.helpHtml.forEach((cat) => {
      var r = SmoHelp._buildElements(cat);
      $('.helpDialog').append(r.dom());
    });
    $('.helpDialog').append(SmoHelp.closeButton.dom());
		$('button.help-title').off('click').on('click',function(ev) {
			$(this).closest('div.helpLine').toggleClass('showSection');
			$(this).find('span.icon').toggleClass('icon-plus');
			$(this).find('span.icon').toggleClass('icon-minus');
		});
    $('.helpDialog button.icon-cross').off('click').on('click', function () {
        $('body').removeClass('showHelpDialog');
        $('.workspace').css("height",'');
    });
    var wsh = window.innerHeight;
    $('.workspace').css("height",''+wsh+'px');
  }

  static get closeButton() {
      var b = htmlHelpers.buildDom;
      var r = b('div').classes('help-closer').append(
        b('button').classes('icon-cross close'));
      return r;
  }

  static _buildElements(helps) {
    var b = htmlHelpers.buildDom;
    var r = b('div').classes('helpLine')
      .append(b('div').classes('help-category-button')
        .append(b('button')
          .append(b('span').classes('icon icon-plus')).classes('help-title')
          .append(b('span').classes('help-category-text').text(helps.title))))
      .append(b('div').classes('help-content').html(helps.html));

    return r;
  }

  static get helpHtml() {
    return [
      {title:'Quick Start',html:SmoLanguage.getHelpFile('quickStartHtml')},
      {title:'Selections and Selecting Things',html:SmoLanguage.getHelpFile('selectionHtml')},
      {title:'Entering Music (Pitches)',html:SmoLanguage.getHelpFile('enterPitchesHtml')},
      {title:'Entering Music (Durations)',html:SmoLanguage.getHelpFile('enterDurationsHtml')},
      {title:'Working with Text, Lyrics, Chords',html:SmoLanguage.getHelpFile('workingWithText')}
    ];
  }
}
