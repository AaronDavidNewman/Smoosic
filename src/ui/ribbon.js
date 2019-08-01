
class RibbonHtml {
	static ribbonButton(buttonClass,buttonText,buttonKey) {
        var b = htmlHelpers.buildDom;
        var r = b('button').classes(buttonClass).append(
                b('span').classes('ribbon-button-text').text(buttonText)).append(
				b('span').classes('ribbon-button-hotkey').text(buttonKey));
		return r.dom();
	}
	
	static navigationGroup() {
		
	}

}