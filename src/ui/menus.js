
class suiMenu {
	constructor(params) {
		Vex.Merge(this, params);		
	}
	
	attach(el) {
		this.menu=$('<select/>');
		$(list).addClass('menuOption');
		var self=this;
		this.menuItems.forEach((item) => {
			var sel = $('<option/>');
			var img = $('<span/>');
			$(img).addClass('icon '+item.icon);
			$(sel).text=item.text;
			$(sel).append(img);
			$(list).append(sel);
		});
		var position=$(el).offset();
		$(list).css('left',''+position.left+'px');
		$(list).css('top',''+position.top+'px');
		$(this.parent).append(this.menu);
		$(this.menu).off('change').on('change',function(ev) {
			self.selection(ev);
		});
	}
	
}

class suiKeySignatureMenu extends suiMenu {
	
	constructor(params) {
		Vex.Merge(suiKeySignatureMenu.defaults, params);
		Vex.Merge(this, params);		
	}
	static defaults = {
		return {menuItems:[
		{icon:'keySigC',text:'C Major'},
		{icon:'keySigF',text:'F Major'},
		{icon:'keySigG',text:'G Major'},
		{icon:'keySigBb',text:'Bb Major'},
		{icon:'keySigD',text:'D Major'},
		{icon:'keySigEb',text:'Eb Major'},
		{icon:'keySigA',text:'A Major'},
		{icon:'keySigAb',text:'Ab Major'},
		{icon:'keySigE',text:'Db Major'},
		{icon:'keySigDb',text:'Db Major'},
		{icon:'keySigB',text:'B Major'},
		{icon:'keySigFs',text:'F# Major'},
		{icon:'keySigCs',text:'Gg Major'}
		]};
	}
	selection(ev) {
		
	}
	
}