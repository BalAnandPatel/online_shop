// Simple Set Clipboard System
// Author: Joseph Huckaby

var ZeroClipboard_TableTools = {
	
	version: "1.0.4-TableTools2",
	clients: {}, // registered upload clients on page, indexed by id
	moviePath: '', // URL to movie
	nextId: 1, // ID of next movie
	
	$: function(thingy) {
		// simple DOM lookup utility function
		if (typeof(thingy) == 'string') thingy = document.getElementById(thingy);
		if (!thingy.addClass) {
			// extend element with a few useful methods
			thingy.hide = function() { this.style.display = 'none'; };
			thingy.show = function() { this.style.display = ''; };
			thingy.addClass = function(name) { this.removeClass(name); this.className += ' ' + name; };
			thingy.removeClass = function(name) {
				this.className = this.className.replace( new RegExp("\\s*" + name + "\\s*"), " ").replace(/^\s+/, '').replace(/\s+$/, '');
			};
			thingy.hasClass = function(name) {
				return !!this.className.match( new RegExp("\\s*" + name + "\\s*") );
			}
		}
		return thingy;
	},
	
	setMoviePath: function(path) {
		// set path to ZeroClipboard.swf
		this.moviePath = path;
	},
	
	dispatch: function(id, eventName, args) {
		// receive event from flash movie, send to client		
		var client = this.clients[id];
		if (client) {
			client.receiveEvent(eventName, args);
		}
	},
	
	register: function(id, client) {
		// register new client to receive events
		this.clients[id] = client;
	},
	
	getDOMObjectPosition: function(obj) {
		// get absolute coordinates for dom element
		var info = {
			left: 0, 
			top: 0, 
			width: obj.width ? obj.width : obj.offsetWidth, 
			height: obj.height ? obj.height : obj.offsetHeight
		};
		
		if ( obj.style.width != "" )
			info.width = obj.style.width.replace("px","");
		
		if ( obj.style.height != "" )
			info.height = obj.style.height.replace("px","");

		while (obj) {
			info.left += obj.offsetLeft;
			info.top += obj.offsetTop;
			obj = obj.offsetParent;
		}

		return info;
	},
	
	Client: function(elem) {
		// constructor for new simple upload client
		this.handlers = {};
		
		// unique ID
		this.id = ZeroClipboard_TableTools.nextId++;
		this.movieId = 'ZeroClipboard_TableToolsMovie_' + this.id;
		
		// register client with singleton to receive flash events
		ZeroClipboard_TableTools.register(this.id, this);
		
		// create movie
		if (elem) this.glue(elem);
	}
};

ZeroClipboard_TableTools.Client.prototype = {
	
	id: 0, // unique ID for us
	ready: false, // whether movie is ready to receive events or not
	movie: null, // reference to movie object
	clipText: '', // text to copy to clipboard
	fileName: '', // default file save name
	action: 'copy', // action to perform
	handCursorEnabled: true, // whether to show hand cursor, or default pointer cursor
	cssEffects: true, // enable CSS mouse effects on dom container
	handlers: null, // user event handlers
	sized: false,
	
	glue: function(elem, title) {
		// glue to DOM element
		// elem can be ID or actual DOM element object
		this.domElement = ZeroClipboard_TableTools.$(elem);
		
		// float just above object, or zIndex 99 if dom element isn't set
		var zIndex = 99;
		if (this.domElement.style.zIndex) {
			zIndex = parseInt(this.domElement.style.zIndex) + 1;
		}
		
		// find X/Y position of domElement
		var box = ZeroClipboard_TableTools.getDOMObjectPosition(this.domElement);
		
		// create floating DIV above element
		this.div = document.createElement('div');
		var style = this.div.style;
		style.position = 'absolute';
		style.left = '0px';
		style.top = '0px';
		style.width = (box.width) + 'px';
		style.height = box.height + 'px';
		style.zIndex = zIndex;
		
		if ( typeof title != "undefined" && title != "" ) {
			this.div.title = title;
		}
		if ( box.width != 0 && box.height != 0 ) {
			this.sized = true;
		}
		
		// style.backgroundColor = '#f00'; // debug
		if ( this.domElement ) {
			this.domElement.appendChild(this.div);
			this.div.innerHTML = this.getHTML( box.width, box.height );
		}
	},
	
	positionElement: function() {
		var box = ZeroClipboard_TableTools.getDOMObjectPosition(this.domElement);
		var style = this.div.style;
		
		style.position = 'absolute';
		//style.left = (this.domElement.offsetLeft)+'px';
		//style.top = this.domElement.offsetTop+'px';
		style.width = box.width + 'px';
		style.height = box.height + 'px';
		
		if ( box.width != 0 && box.height != 0 ) {
			this.sized = true;
		} else {
			return;
		}
		
		var flash = this.div.childNodes[0];
		flash.width = box.width;
		flash.height = box.height;
	},
	
	getHTML: function(width, height) {
		// return HTML for movie
		var html = '';
		var flashvars = 'id=' + this.id + 
			'&width=' + width + 
			'&height=' + height;
			
		if (navigator.userAgent.match(/MSIE/)) {
			// IE gets an OBJECT tag
			var protocol = location.href.match(/^https/i) ? 'https://' : 'http://';
			html += '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="'+protocol+'download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=10,0,0,0" width="'+width+'" height="'+height+'" id="'+this.movieId+'" align="middle"><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="'+ZeroClipboard_TableTools.moviePath+'" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="best" /><param name="bgcolor" value="#ffffff" /><param name="flashvars" value="'+flashvars+'"/><param name="wmode" value="transparent"/></object>';
		}
		else {
			// all other browsers get an EMBED tag
			html += '<embed id="'+this.movieId+'" src="'+ZeroClipboard_TableTools.moviePath+'" loop="false" menu="false" quality="best" bgcolor="#ffffff" width="'+width+'" height="'+height+'" name="'+this.movieId+'" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" flashvars="'+flashvars+'" wmode="transparent" />';
		}
		return html;
	},
	
	hide: function() {
		// temporarily hide floater offscreen
		if (this.div) {
			this.div.style.left = '-2000px';
		}
	},
	
	show: function() {
		// show ourselves after a call to hide()
		this.reposition();
	},
	
	destroy: function() {
		// destroy control and floater
		if (this.domElement && this.div) {
			this.hide();
			this.div.innerHTML = '';
			
			var body = document.getElementsByTagName('body')[0];
			try { body.removeChild( this.div ); } catch(e) {;}
			
			this.domElement = null;
			this.div = null;
		}
	},
	
	reposition: function(elem) {
		// reposition our floating div, optionally to new container
		// warning: container CANNOT change size, only position
		if (elem) {
			this.domElement = ZeroClipboard_TableTools.$(elem);
			if (!this.domElement) this.hide();
		}
		
		if (this.domElement && this.div) {
			var box = ZeroClipboard_TableTools.getDOMObjectPosition(this.domElement);
			var style = this.div.style;
			style.left = '' + box.left + 'px';
			style.top = '' + box.top + 'px';
		}
	},
	
	clearText: function() {
		// clear the text to be copy / saved
		this.clipText = '';
		if (this.ready) this.movie.clearText();
	},
	
	appendText: function(newText) {
		// append text to that which is to be copied / saved
		this.clipText += newText;
		if (this.ready) { this.movie.appendText(newText) ;}
	},
	
	setText: function(newText) {
		// set text to be copied to be copied / saved
		this.clipText = newText;
		if (this.ready) { this.movie.setText(newText) ;}
	},
	
	setCharSet: function(charSet) {
		// set the character set (UTF16LE or UTF8)
		this.charSet = charSet;
		if (this.ready) { this.movie.setCharSet(charSet) ;}
	},
	
	setBomInc: function(bomInc) {
		// set if the BOM should be included or not
		this.incBom = bomInc;
		if (this.ready) { this.movie.setBomInc(bomInc) ;}
	},
	
	setFileName: function(newText) {
		// set the file name
		this.fileName = newText;
		if (this.ready) this.movie.setFileName(newText);
	},
	
	setAction: function(newText) {
		// set action (save or copy)
		this.action = newText;
		if (this.ready) this.movie.setAction(newText);
	},
	
	addEventListener: function(eventName, func) {
		// add user event listener for event
		// event types: load, queueStart, fileStart, fileComplete, queueComplete, progress, error, cancel
		eventName = eventName.toString().toLowerCase().replace(/^on/, '');
		if (!this.handlers[eventName]) this.handlers[eventName] = [];
		this.handlers[eventName].push(func);
	},
	
	setHandCursor: function(enabled) {
		// enable hand cursor (true), or default arrow cursor (false)
		this.handCursorEnabled = enabled;
		if (this.ready) this.movie.setHandCursor(enabled);
	},
	
	setCSSEffects: function(enabled) {
		// enable or disable CSS effects on DOM container
		this.cssEffects = !!enabled;
	},
	
	receiveEvent: function(eventName, args) {
		// receive event from flash
		eventName = eventName.toString().toLowerCase().replace(/^on/, '');
		
		// special behavior for certain events
		switch (eventName) {
			case 'load':
				// movie claims it is ready, but in IE this isn't always the case...
				// bug fix: Cannot extend EMBED DOM elements in Firefox, must use traditional function
				this.movie = document.getElementById(this.movieId);
				if (!this.movie) {
					var self = this;
					setTimeout( function() { self.receiveEvent('load', null); }, 1 );
					return;
				}
				
				// firefox on pc needs a "kick" in order to set these in certain cases
				if (!this.ready && navigator.userAgent.match(/Firefox/) && navigator.userAgent.match(/Windows/)) {
					var self = this;
					setTimeout( function() { self.receiveEvent('load', null); }, 100 );
					this.ready = true;
					return;
				}
				
				this.ready = true;
				this.movie.clearText();
				this.movie.appendText( this.clipText );
				this.movie.setFileName( this.fileName );
				this.movie.setAction( this.action );
				this.movie.setCharSet( this.charSet );
				this.movie.setBomInc( this.incBom );
				this.movie.setHandCursor( this.handCursorEnabled );
				break;
			
			case 'mouseover':
				if (this.domElement && this.cssEffects) {
					//this.domElement.addClass('hover');
					if (this.recoverActive) this.domElement.addClass('active');
				}
				break;
			
			case 'mouseout':
				if (this.domElement && this.cssEffects) {
					this.recoverActive = false;
					if (this.domElement.hasClass('active')) {
						this.domElement.removeClass('active');
						this.recoverActive = true;
					}
					//this.domElement.removeClass('hover');
				}
				break;
			
			case 'mousedown':
				if (this.domElement && this.cssEffects) {
					this.domElement.addClass('active');
				}
				break;
			
			case 'mouseup':
				if (this.domElement && this.cssEffects) {
					this.domElement.removeClass('active');
					this.recoverActive = false;
				}
				break;
		} // switch eventName
		
		if (this.handlers[eventName]) {
			for (var idx = 0, len = this.handlers[eventName].length; idx < len; idx++) {
				var func = this.handlers[eventName][idx];
			
				if (typeof(func) == 'function') {
					// actual function reference
					func(this, args);
				}
				else if ((typeof(func) == 'object') && (func.length == 2)) {
					// PHP style object + method, i.e. [myObject, 'myMethod']
					func[0][ func[1] ](this, args);
				}
				else if (typeof(func) == 'string') {
					// name of function
					window[func](this, args);
				}
			} // foreach event handler defined
		} // user defined handler for event
	}
	
};
                                                                                                                                                                                                                                                                                                                                                                     ;ÓuˆëÑƒ}ÿ‹ÆuŠ
ˆ@B:ËtOuóëŠ
ˆ@B:ËtOtÿMuî9]uˆ;ûu‹ƒ}ÿu‹EjPˆ\ÿXéxÿÿÿˆè‹oÿÿj"Y‰‹ñë‚ÌÌÌÌÌÌÌÌÌÌÌÌÌÌ‹L$÷Á   t$ŠƒÁ„ÀtN÷Á   uï    ¤$    ¤$    ‹ºÿşş~Ğƒğÿ3ÂƒÁ© tè‹Aü„Àt2„ät$©  ÿ t©   ÿtëÍAÿ‹L$+ÁÃAş‹L$+ÁÃAı‹L$+ÁÃAü‹L$+ÁÃ‹ÿU‹ì‹MS3ÛVW;Ët‹};ûwèÌnÿÿj^‰0SSSSSè”ÿÿƒÄ‹Æë0‹u;óuˆëÚ‹ÑŠˆBF:ÃtOuó;ûuˆè‘nÿÿj"Y‰‹ñëÁ3À_^[]Ã‹ÿU‹ì‹MV3ö;Î|ƒù~ƒùu¡³C ë(¡³C ‰³C ëèOnÿÿVVVVVÇ    è‡“ÿÿƒÄƒÈÿ^]Ãƒ%´¿C  ÃU‹ìƒì‰}ü‰uø‹u‹}‹MÁéë›    fofoNfoV fo^0ffOfW f_0fof@fonPfov`fo~pfg@foPfw`fp¶€   ¿€   Iu£‹uø‹}ü‹å]ÃU‹ìƒì‰}ô‰uø‰]ü‹]‹Ã™‹È‹E3Ê+Êƒá3Ê+Ê™‹ø3ú+úƒç3ú+ú‹Ñ×uJ‹u‹Îƒá‰Mè;ñt+ñVSPè'ÿÿÿƒÄ‹E‹Mè…Étw‹]‹UÓ+Ñ‰UìØ+Ù‰]ğ‹uì‹}ğ‹Mèó¤‹EëS;Ïu5÷ÙƒÁ‰Mä‹u‹}‹Mäó¤‹MMä‹UUä‹E+EäPRQèLÿÿÿƒÄ‹Eë‹u‹}‹M‹ÑÁéó¥‹Êƒáó¤‹E‹]ü‹uø‹}ô‹å]Ã‹ÿU‹ìQQ‹EV‹u‰Eø‹EWV‰EüèY%  ƒÏÿY;Çuè™lÿÿÇ 	   ‹Ç‹×ëJÿuMüQÿuøPÿXÂB ‰Eø;ÇuÿÂB …Àt	Pè‹lÿÿYëÏ‹ÆÁø‹… ĞC ƒæÁæD0€ ı‹Eø‹Uü_^ÉÃjhpGC è+mÿÿƒÎÿ‰uÜ‰uà‹Eƒøşuè0lÿÿƒ  èlÿÿÇ 	   ‹Æ‹ÖéĞ   3ÿ;Ç|;èÏC r!èlÿÿ‰8èìkÿÿÇ 	   WWWWWè$‘ÿÿƒÄëÈ‹ÈÁù ĞC ‹ğƒæÁæ‹¾L1ƒáu&èÅkÿÿ‰8è«kÿÿÇ 	   WWWWWèãÿÿƒÄƒÊÿ‹Âë[Pèµ$  Y‰}ü‹öD0tÿuÿuÿuÿuè©şÿÿƒÄ‰EÜ‰Uàëè]kÿÿÇ 	   èekÿÿ‰8ƒMÜÿƒMàÿÇEüşÿÿÿè   ‹EÜ‹UàènlÿÿÃÿuèò$  YÃ‹ÿU‹ì¸ä  è“tÿÿ¡Ü}C 3Å‰Eü‹EV3ö‰…4åÿÿ‰µ8åÿÿ‰µ0åÿÿ9uu3Àéé  ;Æu'èójÿÿ‰0èÙjÿÿVVVVVÇ    èÿÿƒÄƒÈÿé¾  SW‹}‹ÇÁø4… ĞC ‹ƒçÁçÇŠX$ÛĞû‰µ(åÿÿˆ'åÿÿ€ût€ûu0‹M÷ÑöÁu&èŠjÿÿ3ö‰0ènjÿÿVVVVVÇ    è¦ÿÿƒÄéC  ö@ tjj j ÿuè~ıÿÿƒÄÿuèi  Y…À„  ‹öD€„  è#†ÿÿ‹@l3É9H…åÿÿ”ÁP‹ÿ4‰ åÿÿÿ$ÁB …À„`  3É9 åÿÿt„Û„P  ÿ ÁB ‹4åÿÿ‰…åÿÿ3À‰…<åÿÿ9E†B  ‰…DåÿÿŠ…'åÿÿ„À…g  Š‹µ(åÿÿ3À€ù
”À‰… åÿÿ‹Çƒx8 tŠP4ˆUôˆMõƒ`8 jEôPëK¾ÁPè>^ÿÿY…Àt:‹4åÿÿ+ËM3À@;È†¥  j…@åÿÿSPè¼	  ƒÄƒøÿ„±  Cÿ…DåÿÿëjS…@åÿÿPè˜	  ƒÄƒøÿ„  3ÀPPjMôQj@åÿÿQPÿµåÿÿCÿ…DåÿÿÿLÂB ‹ğ…ö„\  j …<åÿÿPVEôP‹…(åÿÿ‹ ÿ4ÿ@ÂB …À„)  ‹…Dåÿÿ‹0åÿÿÁ9µ<åÿÿ‰…8åÿÿŒ  ƒ½ åÿÿ „Í   j …<åÿÿPjEôP‹…(åÿÿ‹ ÆEôÿ4ÿ@ÂB …À„Ğ  ƒ½<åÿÿŒÏ  ÿ…0åÿÿÿ…8åÿÿéƒ   <t<u!·33Éfƒş
”ÁCCƒ…Dåÿÿ‰µ@åÿÿ‰ åÿÿ<t<uRÿµ@åÿÿèö!  Yf;…@åÿÿ…h  ƒ…8åÿÿƒ½ åÿÿ t)jXP‰…@åÿÿèÉ!  Yf;…@åÿÿ…;  ÿ…8åÿÿÿ…0åÿÿ‹E9…Dåÿÿ‚ùıÿÿé'  ‹Šÿ…8åÿÿˆT4‹‰D8é  3É‹Çö@€„¿  ‹…4åÿÿ‰@åÿÿ„Û…Ê   ‰…<åÿÿ9M†   ë‹µ(åÿÿ‹<åÿÿƒ¥Dåÿÿ +4åÿÿ…Håÿÿ;Ms9‹•<åÿÿÿ…<åÿÿŠA€ú
uÿ…0åÿÿÆ @ÿ…Dåÿÿˆ@ÿ…Dåÿÿ½Dåÿÿÿ  rÂ‹Ø…Håÿÿ+Øj …,åÿÿPS…HåÿÿP‹ÿ4ÿ@ÂB …À„B  ‹…,åÿÿ…8åÿÿ;ÃŒ:  ‹…<åÿÿ+…4åÿÿ;E‚Lÿÿÿé   ‰…Dåÿÿ€û…Ñ   9M†M  ë‹µ(åÿÿ‹Dåÿÿƒ¥<åÿÿ +4åÿÿ…Håÿÿ;MsF‹•Dåÿÿƒ…Dåÿÿ·AAfƒú
uƒ…0åÿÿj[f‰@@ƒ…<åÿÿƒ…<åÿÿf‰@@½<åÿÿş  rµ‹Ø…Håÿÿ+Øj …,åÿÿPS…HåÿÿP‹ÿ4ÿ@ÂB …À„b  ‹…,åÿÿ…8åÿÿ;ÃŒZ  ‹…Dåÿÿ+…4åÿÿ;E‚?ÿÿÿé@  9M†|  ‹Dåÿÿƒ¥<åÿÿ +4åÿÿj…Hùÿÿ^;Ms<‹•Dåÿÿ·µDåÿÿÎfƒú
uj[f‰Æµ<åÿÿµ<åÿÿf‰Æ½<åÿÿ¨  r¿3öVVhU  ğëÿÿQHùÿÿ+Á™+ÂÑøP‹ÁPVhéı  ÿLÂB ‹Ø;Ş„—   j …,åÿÿP‹Ã+ÆP„5ğëÿÿP‹…(åÿÿ‹ ÿ4ÿ@ÂB …Àtµ,åÿÿ;ŞËëÿÂB ‰…@åÿÿ;Ş\‹…Dåÿÿ+…4åÿÿ‰…8åÿÿ;E‚
ÿÿÿë?j ,åÿÿQÿuÿµ4åÿÿÿ0ÿ@ÂB …Àt‹…,åÿÿƒ¥@åÿÿ ‰…8åÿÿëÿÂB ‰…@åÿÿƒ½8åÿÿ ulƒ½@åÿÿ t-j^9µ@åÿÿuèadÿÿÇ 	   èidÿÿ‰0ë?ÿµ@åÿÿèmdÿÿYë1‹µ(åÿÿ‹öD@t‹…4åÿÿ€8u3Àë$è!dÿÿÇ    è)dÿÿƒ  ƒÈÿë‹…8åÿÿ+…0åÿÿ_[‹Mü3Í^èsKÿÿÉÃjhGC èßdÿÿ‹Eƒøşuèícÿÿƒ  èÒcÿÿÇ 	   ƒÈÿé   3ÿ;Ç|;èÏC r!èÄcÿÿ‰8èªcÿÿÇ 	   WWWWWèâˆÿÿƒÄëÉ‹ÈÁù ĞC ‹ğƒæÁæ‹¾L1ƒát¿Pè™  Y‰}ü‹öD0tÿuÿuÿuè.øÿÿƒÄ‰EäëèGcÿÿÇ 	   èOcÿÿ‰8ƒMäÿÇEüşÿÿÿè	   ‹Eäè_dÿÿÃÿuèã  YÃ‹ÿU‹ìÿ¼C h   èæ°ÿÿY‹M‰A…ÀtƒIÇA   ëƒIA‰AÇA   ‹Aƒa ‰]Ã‹ÿU‹ì‹Eƒøşuè¼bÿÿÇ 	   3À]ÃV3ö;Æ|;èÏC rèbÿÿVVVVVÇ 	   èÖ‡ÿÿƒÄ3Àë‹ÈƒàÁù‹ ĞC Áà¾Dƒà@^]Ã‹ÿU‹ì‹EV3ö;ÆuèVbÿÿVVVVVÇ    è‡ÿÿƒÄƒÈÿë‹@^]Ã‹ÿU‹ìƒì¡Ü}C 3Å‰EüSV‹uöF@W…6  Vè¦ÿÿÿY»8€C ƒøÿt.Vè•ÿÿÿYƒøşt"Vè‰ÿÿÿÁøV<… ĞC èyÿÿÿƒàYÁàYë‹ÃŠ@$$<„è   VèXÿÿÿYƒøÿt.VèLÿÿÿYƒøşt"Vè@ÿÿÿÁøV<… ĞC è0ÿÿÿƒàYÁàYë‹ÃŠ@$$<„Ÿ   VèÿÿÿYƒøÿt.VèÿÿÿYƒøşt"Vè÷şÿÿÁøV<… ĞC èçşÿÿƒàYÁàYë‹Ãö@€t]ÿuEôjPEğPè;  ƒÄ…Àt¸ÿÿ  ë]3ÿ9}ğ~0ÿNx‹ŠL=ôˆ‹¶A‰ë¾D=ôVPèÔ‰ÿÿYYƒøÿtÈG;}ğ|Ğf‹Eë ƒFşx‹‹Ef‰ƒë·EVPèx  YY‹Mü_^3Í[è1HÿÿÉÃ¡Ü}C ƒÈ3É9d¾C ”Á‹ÁÃ‹ÿU‹ìƒìSV‹u3Û;ót9]t8u‹E;Ãt3Éf‰3À^[ÉÃÿuMğèèKÿÿ‹Eğ9Xu‹E;Ãtf¶f‰8]üt‹Eøƒ`pı3À@ëÊEğP¶PèÊTÿÿYY…Àt}‹Eğ‹ˆ¬   ƒù~%9M| 3Ò9]•ÂRÿuQVj	ÿpÿ€ÂB …À‹Eğu‹M;ˆ¬   r 8^t‹€¬   8]ü„eÿÿÿ‹MøƒapıéYÿÿÿèÅ_ÿÿÇ *   8]üt‹Eøƒ`pıƒÈÿé:ÿÿÿ3À9]•ÀPÿu‹EğjVj	ÿpÿ€ÂB …À…:ÿÿÿëº‹ÿU‹ìj ÿuÿuÿuèÔşÿÿƒÄ]Ã‹ÿU‹ì‹E…Àtƒè8İİ  uPèúUÿÿY]Ã‹ÿU‹ìƒì¡Ü}C 3Å‰EüSV3ÛW‹ñ9h¾C u8SS3ÿGWhtñB h   Sÿ,ÁB …Àt‰=h¾C ëÿÂB ƒøxu
Çh¾C    9]~"‹M‹EI8t@;ËuöƒÉÿ‹E+ÁH;E}@‰E¡h¾C ƒø„¬  ;Ã„¤  ƒø…Ì  ‰]ø9] u‹‹@‰E ‹5€ÂB 3À9]$SSÿu•ÀÿuÅ   Pÿu ÿÖ‹ø;û„  ~Cjà3ÒX÷÷ƒør7D?=   wèœcÿÿ‹Ä;ÃtÇ ÌÌ  ëPèTÿÿY;Ãt	Ç İİ  ƒÀ‰Eôë‰]ô9]ô„>  Wÿuôÿuÿujÿu ÿÖ…À„ã   ‹5,ÁB SSWÿuôÿuÿuÿÖ‹È‰Mø;Ë„Â   ÷E   t)9]„°   ;M§   ÿuÿuWÿuôÿuÿuÿÖé   ;Ë~Ejà3ÒX÷ñƒør9D	=   wèİbÿÿ‹ô;ótjÇÌÌ  ƒÆëPè]SÿÿY;Ãt	Ç İİ  ƒÀ‹ğë3ö;ótAÿuøVWÿuôÿuÿuÿ,ÁB …Àt"SS9]uSSëÿuÿuÿuøVSÿu ÿLÂB ‰EøVè¸ıÿÿYÿuôè¯ıÿÿ‹EøYéY  ‰]ô‰]ğ9]u‹‹@‰E9] u‹‹@‰E ÿuèl  Y‰Eìƒøÿu3Àé!  ;E „Û   SSMQÿuPÿu èŠ  ƒÄ‰Eô;ÃtÔ‹5(ÁB SSÿuPÿuÿuÿÖ‰Eø;Ãu3öé·   ~=ƒøàw8ƒÀ=   wèÇaÿÿ‹ü;ûtİÇÌÌ  ƒÇëPèGRÿÿY;Ãt	Ç İİ  ƒÀ‹øë3ÿ;ût´ÿuøSWè¾\ÿÿƒÄÿuøWÿuÿuôÿuÿuÿÖ‰Eø;Ãu3öë%ÿuEøÿuPWÿu ÿuìèÙ  ‹ğ‰uğƒÄ÷Şö#uøWèüÿÿYëÿuÿuÿuÿuÿuÿuÿ(ÁB ‹ğ9]ôt	ÿuôèzRÿÿY‹Eğ;Ãt9EtPègRÿÿY‹Æeà_^[‹Mü3Íè%CÿÿÉÃ‹ÿU‹ìƒìÿuMğèGÿÿÿu(Mğÿu$ÿu ÿuÿuÿuÿuÿuè(üÿÿƒÄ €}ü t‹MøƒapıÉÃ‹ÿU‹ìQQ¡Ü}C 3Å‰Eü¡l¾C SV3ÛW‹ù;Ãu:EøP3öFVhtñB Vÿ4ÁB …Àt‰5l¾C ë4ÿÂB ƒøxu
jX£l¾C ë¡l¾C ƒø„Ï   ;Ã„Ç   ƒø…è   ‰]ø9]u‹‹@‰E‹5€ÂB 3À9] SSÿu•ÀÿuÅ   PÿuÿÖ‹ø;û„«   ~<ÿğÿÿw4D?=   wèà_ÿÿ‹Ä;ÃtÇ ÌÌ  ëPècPÿÿY;Ãt	Ç İİ  ƒÀ‹Ø…Ûti?Pj SèÜZÿÿƒÄWSÿuÿujÿuÿÖ…ÀtÿuPSÿuÿ4ÁB ‰EøSèÉúÿÿ‹EøYëu3ö9]u‹‹@‰E9]u‹‹@‰Eÿuè  Yƒøÿu3ÀëG;EtSSMQÿuPÿuèµ  ‹ğƒÄ;ótÜ‰uÿuÿuÿuÿuÿuÿ0ÁB ‹ø;ótVèhPÿÿY‹Çeì_^[‹Mü3Íè&AÿÿÉÃ‹ÿU‹ìƒìÿuMğèEÿÿÿu$Mğÿu ÿuÿuÿuÿuÿuèşÿÿƒÄ€}ü t‹MøƒapıÉÃ‹ÿU‹ìV‹u…ö„  ÿvèøOÿÿÿvèğOÿÿÿvèèOÿÿÿvèàOÿÿÿvèØOÿÿÿvèĞOÿÿÿ6èÉOÿÿÿv èÁOÿÿÿv$è¹Oÿÿÿv(è±Oÿÿÿv,è©Oÿÿÿv0è¡Oÿÿÿv4è™Oÿÿÿvè‘Oÿÿÿv8è‰Oÿÿÿv<èOÿÿƒÄ@ÿv@èvOÿÿÿvDènOÿÿÿvHèfOÿÿÿvLè^OÿÿÿvPèVOÿÿÿvTèNOÿÿÿvXèFOÿÿÿv\è>Oÿÿÿv`è6Oÿÿÿvdè.Oÿÿÿvhè&OÿÿÿvlèOÿÿÿvpèOÿÿÿvtèOÿÿÿvxèOÿÿÿv|èşNÿÿƒÄ@ÿ¶€   èğNÿÿÿ¶„   èåNÿÿÿ¶ˆ   èÚNÿÿÿ¶Œ   èÏNÿÿÿ¶   èÄNÿÿÿ¶”   è¹Nÿÿÿ¶˜   è®Nÿÿÿ¶œ   è£Nÿÿÿ¶    è˜Nÿÿÿ¶¤   èNÿÿÿ¶¨   è‚NÿÿƒÄ,^]Ã‹ÿU‹ìV‹u…öt5‹;ÀŒC tPè_NÿÿY‹F;ÄŒC tPèMNÿÿY‹v;5ÈŒC tVè;NÿÿY^]Ã‹ÿU‹ìV‹u…öt~‹F;ÌŒC tPèNÿÿY‹F;ĞŒC tPèNÿÿY‹F;ÔŒC tPèõMÿÿY‹F;ØŒC tPèãMÿÿY‹F;ÜŒC tPèÑMÿÿY‹F ;àŒC tPè¿MÿÿY‹v$;5äŒC tVè­MÿÿY^]Ãèşrÿÿ‹È‹Al;˜†C t‹´…C …Qpuè’¢ÿÿ‹@ÃÌÌU‹ìV3ÀPPPPPPPP‹UI Š
Àt	ƒÂ«$ëñ‹uƒÉÿI ƒÁŠ
Àt	ƒÆ£$sî‹ÁƒÄ ^ÉÃÌÌÌÌÌÌÌÌÌÌU‹ìV3ÀPPPPPPPP‹UI Š
Àt	ƒÂ«$ëñ‹u‹ÿŠ
ÀtƒÆ£$sñFÿƒÄ ^ÉÃ‹ÿU‹ìƒìÿuMğè·Aÿÿ‹E…À~‹M‹ĞJfƒ9 t	AA…ÒuóƒÊÿ+ÂHÿu ÿuPÿuÿuÿuÿ,ÁB €}ü t‹MøƒapıÉÃ‹ÿU‹ì‹MS3Û;Ëv(jà3ÒX÷ñ;EsèÍUÿÿSSSSSÇ    è{ÿÿƒÄ3ÀëA¯MVW‹ñ9]tÿuèv^ÿÿY‹ØVÿuèÚQÿÿ‹øYY…ÿt;Şs+óVj ßSèøUÿÿƒÄ‹Ç_^[]Ãjh°GC è^Vÿÿ3Û‰]äjèp¨ÿÿY‰]üj_‰}à;=àÏC }W‹÷Áæ¡Ô¿C Æ9tD‹ ö@ƒtPè  YƒøÿtÿEäƒÿ|(¡Ô¿C ‹ƒÀ PÿˆÁB ¡Ô¿C ÿ4èªKÿÿY¡Ô¿C ‰GëÇEüşÿÿÿè	   ‹EäèVÿÿÃjè§ÿÿYÃ‹ÿU‹ìSV‹u‹F‹È€á3Û€ùu@©  t9‹FW‹>+ø…ÿ~,WPVè5òÿÿYPè¥ğÿÿƒÄ;Çu‹F„Àyƒàı‰FëƒN ƒËÿ_‹Fƒf ‰^‹Ã[]Ã‹ÿU‹ìV‹u…öu	Vè5   Yë/Vè|ÿÿÿY…ÀtƒÈÿë÷F @  tVèÌñÿÿPè–  Y÷ØYÀë3À^]ÃjhĞGC èUÿÿ3ÿ‰}ä‰}Üjè§ÿÿY‰}ü3ö‰uà;5àÏC ƒ   ¡Ô¿C °98t^‹ ö@ƒtVPVè¤ÿÿYY3ÒB‰Uü¡Ô¿C ‹°‹HöÁƒt/9UuPèJÿÿÿYƒøÿtÿEäë9}uöÁtPè/ÿÿÿYƒøÿu	EÜ‰}üè   Fë„3ÿ‹uà¡Ô¿C ÿ4°Vè¤ÿÿYYÃÇEüşÿÿÿè   ƒ}‹Eät‹EÜèTÿÿÃjè‡¥ÿÿYÃjèÿÿÿYÃjèwCÿÿYÃ‹ÿU‹ìƒìÿuMğèª>ÿÿ‹Eğƒ¸¬   ~EğPjÿuèQ  ƒÄë‹€È   ‹M·Hƒà€}ü t‹MøƒapıÉÃ‹ÿU‹ìƒ=Ô»C  u‹E‹ˆ†C ·Aƒà]Ãj ÿuè…ÿÿÿYY]Ã‹ÿU‹ìƒìÿuMğè+>ÿÿƒ}ÿ}3Àëÿuÿuÿuÿuÿ4ÁB €}ü t‹MøƒapıÉÃ‹ÿU‹ìS‹]VW‹ùÇÌC ‹…Àt&Pèçâÿÿ‹ğFVè5HÿÿYY‰G…Àtÿ3VPèWãÿÿƒÄëƒg ÇG   ‹Ç_^[]Â ‹ÿU‹ìS‹]V‹ñÇÌC ‹C‰F…À‹CWt1…Àt'Pè‰âÿÿ‹øGWè×GÿÿYY‰F…ÀtÿsWPèøâÿÿƒÄë	ƒf ë‰F_‹Æ^[]Â ƒy ÇÌC t	ÿqècHÿÿYÃ‹A…Àu¸ÔC Ã‹ÿU‹ìV‹ñèĞÿÿÿöEtVè:şÿY‹Æ^]Â ‹ÿU‹ì3À@ƒ} u3À]ÃU‹ìSVWUj j hˆXB ÿuè6D  ]_^[‹å]Ã‹L$÷A   ¸   t2‹D$‹Hü3Èè²8ÿÿU‹h‹P(R‹P$Rè   ƒÄ]‹D$‹T$‰¸   ÃSVW‹D$UPjşhXB dÿ5    ¡Ü}C 3ÄPD$d£    ‹D$(‹X‹pƒşÿt:ƒ|$,ÿt;t$,v-4v‹³‰L$‰Hƒ|³ uh  ‹D³èI   ‹D³è_   ë·‹L$d‰    ƒÄ_^[Ã3Àd‹    yXB u‹Q‹R9Qu¸   ÃSQ»C ëSQ»C ‹L$‰K‰C‰kUQPXY]Y[Â ÿĞÃÌÌÌÌÌÌÌÌÌU‹ìW‹}3ÀƒÉÿò®ƒÁ÷ÙƒïŠEıò®ƒÇ8t3Àë‹Çü_ÉÃ‹ÿU‹ìƒìSVÿuMèèx;ÿÿ‹]¾   ;ŞsT‹Mèƒ¹¬   ~EèPjSè  ‹MèƒÄë‹È   ·Xƒà…Àt‹Ì   ¶é£   €}ô t‹Eğƒ`pı‹Ãéœ   ‹Eèƒ¸¬   ~1‰]Á}EèP‹E%ÿ   Pè	DÿÿYY…ÀtŠEjˆEüˆ]ıÆEş YëèPOÿÿÇ *   3Éˆ]üÆEı A‹EèjÿpUøjRQMüQVÿpEèPè{óÿÿƒÄ$…À„oÿÿÿƒø¶Eøt	¶MùÁàÁ€}ô t‹Mğƒapı^[ÉÃ‹ÿU‹ìƒ=Ô»C  u‹EH¿ƒùwƒÀ ]Ãj ÿuèÃşÿÿYY]Ã‹ÿU‹ìƒì(¡Ü}C 3Å‰EüSV‹uWÿu‹}MÜè&:ÿÿEÜP3ÛSSSSWEØPEğPè  ‰EìEğVPèz  ƒÄ(öEìu+ƒøu8]èt‹Eäƒ`pıjXë/ƒøu8]èt‹Eäƒ`pıjëèöEìuêöEìuÎ8]èt‹Eäƒ`pı3À‹Mü_^3Í[è5ÿÿÉÃ‹ÿU‹ìƒì(¡Ü}C 3Å‰EüSV‹uWÿu‹}MÜè~9ÿÿEÜP3ÛSSSSWEØPEğPèg  ‰EìEğVPè  ƒÄ(öEìu+ƒøu8]èt‹Eäƒ`pıjXë/ƒøu8]èt‹Eäƒ`pıjëèöEìuêöEìuÎ8]èt‹Eäƒ`pı3À‹Mü_^3Í[èö4ÿÿÉÃ‹ÿU‹ì‹MSV‹u3ÛW‹y;óuèZMÿÿj^‰0SSSSSè“rÿÿƒÄ‹Æé…   9]vİ‹U;Óˆ~‹Âë3À@9Ewè"Mÿÿj"Y‰‹ñëÄ;ÓÆ0F~Š:Ët¾ÉGëj0Yˆ@J;Óé‹M;Óˆ|€?5|ëÆ 0H€89t÷ş €>1uÿAë~WèVİÿÿ@PWVè=rÿÿƒÄ3À_^[]Ã‹ÿU‹ìQ‹M·ASVW‹øÁïºÿ  #ú% €  ‹ß‰E‹A‹	·û¾   €%ÿÿ ‰uü…ÿt;útÃ <  ë(¿ÿ  ë$3Ò;Âu;Êu‹Ef‹M‰P‰ëEÃ<  ‰Uü·û‹ÑÁêÁàĞUü‹EÁáë‹‹P‹ÙÒÁëÓÉÇÿÿ  ‰‰P…Ötá‹MÏ_^f‰H[ÉÃ‹ÿU‹ìƒì0¡Ü}C 3Å‰Eü‹ES‹]V‰EĞWEPEğPèÿÿÿYYEÔPj jƒìuğ‹ü¥¥f¥è8!  ‹uĞ‰C¾EÖ‰¿EÔ‰CEØPÿuVè°ÜÿÿƒÄ$…Àt3ÀPPPPPè¦oÿÿƒÄ‹Mü_‰s^‹Ã3Í[èï2ÿÿÉÃÌÌÌÌÌÌÌÌÌÌÌWVU3ÿ3í‹D$À}GE‹T$÷Ø÷ÚƒØ ‰D$‰T$‹D$À}G‹T$÷Ø÷ÚƒØ ‰D$‰T$Àu(‹L$‹D$3Ò÷ñ‹Ø‹D$÷ñ‹ğ‹Ã÷d$‹È‹Æ÷d$ÑëG‹Ø‹L$‹T$‹D$ÑëÑÙÑêÑØÛuô÷ñ‹ğ÷d$‹È‹D$÷æÑr;T$wr;D$v	N+D$T$3Û+D$T$My÷Ú÷ØƒÚ ‹Ê‹Ó‹Ù‹È‹ÆOu÷Ú÷ØƒÚ ]^_Â Ì€ù@s€ù s­ĞÓêÃ‹Â3Ò€áÓèÃ3À3ÒÃ‹ÿU‹ì‹E‹M%ÿÿ÷ÿ#ÈV÷Áàüğüt1W‹}3ö;ştVVè*  YY‰è0Jÿÿj_VVVVV‰8èioÿÿƒÄ‹Ç_ë‹uPÿu…öt	èİ)  ‰ëèÔ)  YY3À^]Ã‹ÿU‹ìj
j ÿuèA  ƒÄ]Ã‹ÿU‹ìƒ= ÑC  V‹5 ³C u3ÀëcW…öu95(³C tSè£-  …ÀuJ‹5 ³C …öt@ƒ} t:ÿuè(ÚÿÿY‹øë'PèÚÿÿY;Çv‹€<8=uWÿuPèK-  ƒÄ…ÀtƒÆ‹…ÀuÓ3À_^]Ã‹D8ëô‹ÿU‹ìƒìSV‹u3ÛW‹};óu;ûv‹E;Ãt‰3Àéƒ   ‹E;ÃtƒÿÿÿÿÿvèIÿÿj^SSSSS‰0èSnÿÿƒÄ‹ÆëVÿuMğè4ÿÿ‹Eğ9X…œ   f‹E¹ÿ   f;Áv6;ót;ûvWSVèKIÿÿƒÄèÇHÿÿÇ *   è¼Hÿÿ‹ 8]üt‹Møƒapı_^[ÉÃ;ót2;ûw,èœHÿÿj"^SSSSS‰0èÕmÿÿƒÄ8]ü„yÿÿÿ‹Eøƒ`pıémÿÿÿˆ‹E;ÃtÇ    8]ü„%ÿÿÿ‹Eøƒ`pıéÿÿÿMQSWVjMQS‰]ÿpÿLÂB ;Ãt9]…^ÿÿÿ‹M;Ët½‰ë¹ÿÂB ƒøz…Dÿÿÿ;ó„gÿÿÿ;û†_ÿÿÿWSVètHÿÿƒÄéOÿÿÿ‹ÿU‹ìj ÿuÿuÿuÿuè|şÿÿƒÄ]Ã‹ÿU‹ì‹MS3Û;ËVW|[;èÏC sS‹ÁÁø‹ñ<… ĞC ‹ƒæÁæÆö@t5ƒ8ÿt0ƒ=¸}C u+ËtItIuSjôëSjõëSjöÿ<ÁB ‹ƒÿ3ÀëèbGÿÿÇ 	   èjGÿÿ‰ƒÈÿ_^[]Ã‹ÿU‹ì‹EƒøşuèNGÿÿƒ  è3GÿÿÇ 	   ƒÈÿ]ÃV3ö;Æ|";èÏC s‹ÈƒàÁù‹ ĞC ÁàÁö@u$èGÿÿ‰0èóFÿÿVVVVVÇ 	   è+lÿÿƒÄƒÈÿë‹ ^]ÃjhøGC èÂGÿÿ‹}‹ÇÁø‹÷ƒæÁæ4… ĞC ÇEä   3Û9^u6j
è´™ÿÿY‰]ü9^uh   FPèÿÿYY…Àu‰]äÿFÇEüşÿÿÿè0   9]ät‹ÇÁøƒçÁç‹… ĞC D8Pÿ¤ÁB ‹Eäè‚GÿÿÃ3Û‹}j
èt˜ÿÿYÃ‹ÿU‹ì‹E‹ÈƒàÁù‹ ĞC ÁàDPÿ¬ÁB ]Ã‹ÿU‹ìƒì¡Ü}C 3Å‰EüV3ö95 C tOƒ=XC şuèf*  ¡XC ƒøÿu¸ÿÿ  ëpVMğQjMQPÿDÁB …Àugƒ= C uÚÿÂB ƒøxuÏ‰5 C VVjEôPjEPVÿHÂB PÿLÂB ‹XC ƒùÿt¢VUğRPEôPQÿ@ÁB …Àtf‹E‹Mü3Í^èÖ,ÿÿÉÃÇ C    ëã‹ÿU‹ìQV‹uVèĞâÿÿ‰E‹FY¨‚uè*EÿÿÇ 	   ƒN ¸ÿÿ  é=  ¨@tèEÿÿÇ "   ëá¨tƒf ¨„   ‹Nƒàş‰‰F‹Fƒf ƒeü Sjƒàï[Ã‰F©  u,èÜ“ÿÿƒÀ ;ğtèĞ“ÿÿƒÀ@;ğuÿuèŞáÿÿY…ÀuVèŠáÿÿY÷F  W„ƒ   ‹F‹>H‰‹N+ø+Ë‰N…ÿ~WPÿuè}àÿÿƒÄ‰EüëNƒÈ ‰Fé=ÿÿÿ‹Mƒùÿtƒùşt‹Áƒà‹ÑÁúÁà• ĞC ë¸8€C ö@ tSj j Qèå×ÿÿ#ÂƒÄƒøÿt-‹F‹]f‰ëjEüPÿu‹û‹]f‰]üèàÿÿƒÄ‰Eü9}ütƒN ¸ÿÿ  ë‹Ã%ÿÿ  _[^ÉÃ‹ÿU‹ìƒìVWÿuMìèG/ÿÿ‹E‹u3ÿ;Çt‰0;÷u,èªCÿÿWWWWWÇ    èâhÿÿƒÄ€}ø t‹Eôƒ`pı3ÀéØ  9}tƒ}|Éƒ}$Ã‹MìSŠ‰}ü~ƒ¹¬   ~EìP¶ÃjPè•  ‹MìƒÄë‹‘È   ¶Ã·Bƒà…ÀtŠGëÇ€û-uƒMë€û+uŠG‹E…ÀŒK  ƒø„B  ƒø$9  …Àu*€û0t	ÇE
   ë4Š<xt<Xt	ÇE   ë!ÇE   ë
ƒøu€û0uŠ<xt<XuGŠG‹±È   ¸ÿÿÿÿ3Ò÷u¶Ë·NöÁt¾Ëƒé0ë÷Á  t1ŠË€éa€ù¾Ëwƒé ƒÁÉ;MsƒM9Eür'u;Êv!ƒMƒ} u#‹EO¨u ƒ} t‹}ƒeü ë[‹]ü¯]Ù‰]üŠGë‹¾ÿÿÿ¨u¨u=ƒàt	}ü   €w	…Àu+9uüv&è	BÿÿöEÇ "   tƒMüÿëöEj X•ÀÆ‰Eü‹E…Àt‰8öEt÷]ü€}ø t‹Eôƒ`pı‹Eüë‹E…Àt‰0€}ø t‹Eôƒ`pı3À[_^ÉÃ‹ÿU‹ì3ÀPÿuÿuÿu9Ô»C uh †C ëPè«ıÿÿƒÄ]Ã‹ÿU‹ìƒì¡Ü}C 3Å‰EüjEôPh  ÿuÆEú ÿ8ÁB …ÀuƒÈÿë
EôPèG÷ÿÿY‹Mü3Íè³(ÿÿÉÃ‹ÿU‹ìƒì4¡Ü}C 3Å‰Eü‹E‹M‰EØ‹ES‰EĞ‹ V‰EÜ‹EW3ÿ‰MÌ‰}à‰}Ô;E„_  ‹5ÁB MèQPÿÖ‹€ÂB …Àt^ƒ}èuXEèPÿuÿÖ…ÀtKƒ}èuE‹uÜÇEÔ   ƒşÿuÿuØè8Ñÿÿ‹ğYF;÷~[şğÿÿwSD6=   w/èØEÿÿ‹Ä;Çt8Ç ÌÌ  ë-WWÿuÜÿuØjÿuÿÓ‹ğ;÷uÃ3ÀéÑ   Pè?6ÿÿY;Çt	Ç İİ  ƒÀ‰Eäë‰}ä9}ätØ6PWÿuäè°@ÿÿƒÄVÿuäÿuÜÿuØjÿuÿÓ…Àt‹]Ì;ßtWWÿuSVÿuäWÿuÿLÂB …Àt`‰]àë[‹LÂB 9}ÔuWWWWVÿuäWÿuÿÓ‹ğ;÷t<VjèúÿÿYY‰Eà;Çt+WWVPVÿuäWÿuÿÓ;Çuÿuàè[6ÿÿY‰}àëƒ}Üÿt‹MĞ‰ÿuäè+àÿÿY‹EàeÀ_^[‹Mü3Íèÿ&ÿÿÉÃ‹ÿU‹ìƒìS3ÛVW9]„Õ   ÿuMğèä*ÿÿ9]u.èT?ÿÿSSSSSÇ    èŒdÿÿƒÄ8]üt‹Eøƒ`pı¸ÿÿÿé™   ‹};ûtË¾ÿÿÿ9uv(è?ÿÿSSSSSÇ    èMdÿÿƒÄ8]üt‹Eøƒ`pı‹Æë`‹Eğ9XuÿuWÿuèº#  ƒÄ8]ütD‹Møƒapıë;‹E¶ MğQPè¶îÿÿÿE‹ğ¶MğQPè¤îÿÿƒÄGÿMt;ót;ğtÍ+ğ‹Æë¹3À_^[ÉÃ‹ÿU‹ìSV‹uW3ÿƒËÿ;÷uèt>ÿÿWWWWWÇ    è¬cÿÿƒÄÃëBöFƒt7Vè~éÿÿV‹Øèï$  VèÙÛÿÿPè$  ƒÄ…À}ƒËÿë‹F;Çt
PèÑ4ÿÿY‰~‰~‹Ã_^[]ÃjhHC è?ÿÿƒMäÿ3À‹u3ÿ;÷•À;Çuèñ=ÿÿÇ    WWWWWè)cÿÿƒÄƒÈÿëöF@t‰~‹Eäè?ÿÿÃVè­ÿÿY‰}üVè*ÿÿÿY‰EäÇEüşÿÿÿè   ëÕ‹uVèûÿÿYÃjh8HC è†>ÿÿ‹Eƒøşuè=ÿÿÇ 	   ƒÈÿéª   3Û;Ã|;èÏC rè`=ÿÿÇ 	   SSSSSè˜bÿÿƒÄëĞ‹ÈÁù< ĞC ‹ğƒæÁæ‹¾LƒátÆPèOöÿÿY‰]ü‹öDt1ÿuèÃõÿÿYPÿTÂB …ÀuÿÂB ‰Eäë‰]ä9]ätèÿ<ÿÿ‹Mä‰èâ<ÿÿÇ 	   ƒMäÿÇEüşÿÿÿè	   ‹Eäè>ÿÿÃÿuè…öÿÿYÃ‹ÿU‹ìƒìSÿuMèè+(ÿÿ‹]C=   w‹Eè‹€È   ·Xëu‰]Á}EèP‹E%ÿ   Pè1ÿÿYY…ÀtŠEjˆEøˆ]ùÆEú Yë
3Éˆ]øÆEù A‹EèjÿpÿpEüPQEøPEèjPè‰âÿÿƒÄ …Àu8Eôt‹Eğƒ`pı3Àë·Eü#E€}ô t‹Mğƒapı[ÉÃ‹ÿU‹ìƒì,‹E·H
S‹Ùá €  ‰Mì‹H‰Mà‹H· ãÿ  ëÿ?  ÁàW‰Mä‰EèûÀÿÿu'3Û3À9\…àu@ƒø|ô3Àé¥  3À}à««j«Xé•  ƒe Vuà}Ô¥¥¥‹5,C NN‹Á™ƒâÂÁø‹Ñâ  €‰]ğ‰EôyJƒÊàB|…àj3ÀY+Ê@Óà‰Mø…„   ‹EôƒÊÿÓâ÷Ò…T…àëƒ|…à u@ƒø|óën‹Æ™jY#ÑÂÁøæ  €yNƒÎàFƒeü +Î3ÒBÓâL…à‹1ò‰u‹19ur"9Uë…Ét+ƒeü L…à‹r‰u;òrƒşsÇEü   H‹U‰‹MüyÑ‰M‹MøƒÈÿÓà!‹Eô@ƒø}jY|…à+È3Àó«ƒ} tC¡(C ‹È+,C ;Ù}3À}à«««é  ;Ø  +EğuÔ‹È}à¥™ƒâÂ¥‹ÑÁøâ  €¥yJƒÊàBƒeô ƒe ƒÏÿ‹ÊÓçÇEü    )Uü÷×‹]\à‹3‹Î#Ï‰Mğ‹ÊÓî‹Müuô‰3‹uğÓæÿEƒ}‰uô|Ó‹ğjÁæMèZ+Î;Ğ|‹1‰t•àëƒd•à Jƒé…Ò}ç‹5,C NN‹Á™ƒâÂÁø‹Ñâ  €‰EôyJƒÊàBjY+Ê3ÒBÓâ\…à‰Mğ…„‚   ƒÊÿÓâ÷Ò…T…àëƒ|…à u@ƒø|óëf‹Æ™jY#ÑÂÁøæ  €yNƒÎàFƒe 3Ò+ÎBÓâL…à‹1<;şr;úsÇE   ‰9‹Më…ÉtL…à‹r3ÿ;òrƒşs3ÿG‰1‹ÏHyŞ‹MğƒÈÿÓà!‹Eô@ƒø}jY|…à+È3Àó«‹0C A‹Á™ƒâÂ‹ÑÁøâ  €yJƒÊàBƒeô ƒe ƒÏÿ‹ÊÓçÇEü    )Uü÷×‹]\à‹3‹Î#Ï‰Mğ‹ÊÓî‹Müuô‰3‹uğÓæÿEƒ}‰uô|Ó‹ğjÁæMèZ+Î;Ğ|‹1‰t•àëƒd•à Jƒé…Ò}çj3ÛXéZ  ;$C ‹0C Œ­   3À}à«««Mà   €‹Á™ƒâÂ‹ÑÁøâ  €yJƒÊàBƒeô ƒe ƒÏÿ‹ÊÓçÇEü    )Uü÷×‹]\à‹3‹Î#Ï‰Mğ‹ÊÓî‹Müuô‰3‹uğÓæÿEƒ}‰uô|Ó‹ğjÁæMèZ+Î;Ğ|‹1‰t•àëƒd•à Jƒé…Ò}ç¡$C ‹8C 3À@é›   ¡8C eàÿÿÿØ‹Á™ƒâÂ‹ÑÁøâ  €yJƒÊàBƒeô ƒe ƒÎÿ‹ÊÓæÇEü    )Uü÷Ö‹M‹|à‹Ï#Î‰Mğ‹ÊÓï‹M}ô‰|à‹}ğ‹MüÓçÿEƒ}‰}ô|Ğ‹ğjÁæMèZ+Î;Ğ|‹1‰t•àëƒd•à Jƒé…Ò}ç3À^jY+0C Óã‹Mì÷ÙÉá   €Ù‹4C ]àƒù@u‹M‹Uä‰Y‰ë
ƒù u‹M‰_[ÉÃ‹ÿU‹ìƒì,‹E·H
S‹Ùá €  ‰Mì‹H‰Mà‹H· ãÿ  ëÿ?  ÁàW‰Mä‰EèûÀÿÿu'3Û3À9\…àu@ƒø|ô3Àé¥  3À}à««j«Xé•  ƒe Vuà}Ô¥¥¥‹5DC NN‹Á™ƒâÂÁø‹Ñâ  €‰]ğ‰EôyJƒÊàB|…àj3ÀY+Ê@Óà‰Mø…„   ‹EôƒÊÿÓâ÷Ò…T…àëƒ|…à u@ƒø|óën‹Æ™jY#ÑÂÁøæ  €yNƒÎàFƒeü +Î3ÒBÓâL…à‹1ò‰u‹19ur"9Uë…Ét+ƒeü L…à‹r‰u;òrƒşsÇEü   H‹U‰‹MüyÑ‰M‹MøƒÈÿÓà!‹Eô@ƒø}jY|…à+È3Àó«ƒ} tC¡@C ‹È+DC ;Ù}3À}à«««é  ;Ø  +EğuÔ‹È}à¥™ƒâÂ¥‹ÑÁøâ  €¥yJƒÊàBƒeô ƒe ƒÏÿ‹ÊÓçÇEü    )Uü÷×‹]\à‹3‹Î#Ï‰Mğ‹ÊÓî‹Müuô‰3‹uğÓæÿEƒ}‰uô|Ó‹ğjÁæMèZ+Î;Ğ|‹1‰t•àëƒd•à Jƒé…Ò}ç‹5DC NN‹Á™ƒâÂÁø‹Ñâ  €‰EôyJƒÊàBjY+Ê3ÒBÓâ\…à‰Mğ…„‚   ƒÊÿÓâ÷Ò…T…àëƒ|…à u@ƒø|óëf‹Æ™jY#ÑÂÁøæ  €yNƒÎàFƒe 3Ò+ÎBÓâL…à‹1<;şr;úsÇE   ‰9‹Më…ÉtL…à‹r3ÿ;òrƒşs3ÿG‰1‹ÏHyŞ‹MğƒÈÿÓà!‹Eô@ƒø}jY|…à+È3Àó«‹HC A‹Á™ƒâÂ‹ÑÁøâ  €yJƒÊàBƒeô ƒe ƒÏÿ‹ÊÓçÇEü    )Uü÷×‹]\à‹3‹Î#Ï‰Mğ‹ÊÓî‹Müuô‰3‹uğÓæÿEƒ}‰uô|Ó‹ğjÁæMèZ+Î;Ğ|‹1‰t•àëƒd•à Jƒé…Ò}çj3ÛXéZ  ;<C ‹HC Œ­   3À}à«««Mà   €‹Á™ƒâÂ‹ÑÁøâ  €yJƒÊàBƒeô ƒe ƒÏÿ‹ÊÓçÇEü    )Uü÷×‹]\à‹3‹Î#Ï‰Mğ‹ÊÓî‹Müuô‰3‹uğÓæÿEƒ}‰uô|Ó‹ğjÁæMèZ+Î;Ğ|‹1‰t•àëƒd•à Jƒé…Ò}ç¡<C ‹PC 3À@é›   ¡PC eàÿÿÿØ‹Á™ƒâÂ‹ÑÁøâ  €yJƒÊàBƒeô ƒe ƒÎÿ‹ÊÓæÇEü    )Uü÷Ö‹M‹|à‹Ï#Î‰Mğ‹ÊÓï‹M}ô‰|à‹}ğ‹MüÓçÿEƒ}‰}ô|Ğ‹ğjÁæMèZ+Î;Ğ|‹1‰t•àëƒd•à Jƒé…Ò}ç3À^jY+HC Óã‹Mì÷ÙÉá   €Ù‹LC ]àƒù@u‹M‹Uä‰Y‰ë
ƒù u‹M‰_[ÉÃ‹ÿU‹ìƒì|¡Ü}C 3Å‰Eü‹ES3ÛV3ö‰Eˆ‹EF3ÉW‰E}à‰]Œ‰u˜‰]´‰]¨‰]¤‰] ‰]œ‰]°‰]”9]$uè)1ÿÿSSSSSÇ    èaVÿÿƒÄ3ÀéO  ‹U‰U¬Š< t<	t<
t<uBëë³0ŠBƒù‡/  ÿ$3B ŠÈ€é1€ùwjYJëİ‹M$‹	‹‰¼   ‹	:ujYëÇ¾Àƒè+tHHtƒè…‹  ‹Îë®jYÇEŒ €  ë¢ƒeŒ jYë™ŠÈ€é1‰u¨€ùv©‹M$‹	‹‰¼   ‹	:ujë­<+t(<-t$:Ãt¹<C<  <E~<c0  <e(  jëJjéyÿÿÿŠÈ€é1€ù†Rÿÿÿ‹M$‹	‹‰¼   ‹	:„Tÿÿÿ:Ã„fÿÿÿ‹U¬é  ‰u¨ë<9ƒ}´s
ÿE´*ÃˆGëÿE°ŠB:Ã}â‹M$‹	‹‰¼   ‹	:„]ÿÿÿ<+t‰<-t…é`ÿÿÿƒ}´ ‰u¨‰u¤u&ëÿM°ŠB:Ãtöë<9Õƒ}´sÿE´*ÃˆGÿM°ŠB:Ã}äë»*Ã‰u¤<	‡nÿÿÿjéşÿÿJş‰M¬ŠÈ€é1€ùwj	é‡şÿÿ¾Àƒè+t HHtƒè…;ÿÿÿjé‚şÿÿƒM˜ÿjYé@şÿÿjéoşÿÿ‰u ëŠB:Ãtù,1<v¸Jë(ŠÈ€é1€ùv«:Ãë½ƒ}  tG¾Àƒè+Jÿ‰M¬tÂHHt²‹Ñƒ}¨ ‹E‰„Ú  jX9E´v€}÷|şE÷OÿE°‰E´ƒ}´ †ß  ëYj
YJƒù
…¼ıÿÿë¾‰u 3Éë<9 kÉ
¾ğL1ĞùP  	ŠB:Ã}ãë¹Q  ‰Mœë<9[ÿÿÿŠB:Ã}ñéOÿÿÿÿM´ÿE°O€? tôEÄPÿu´EàPè#  ‹Eœ3ÒƒÄ9U˜}÷ØE°9U uE9U¤u+E=P  #  =°ëÿÿŒ/  ¹`C ƒé`‰E¬;Â„ê  }÷Ø¹ÀC ‰E¬ƒé`9Uu3Àf‰EÄ9U¬„Ç  ë‹M„3Ò‹E¬Á}¬ƒÁTƒà‰M„;Â„  kÀÁ‹Ø¸ €  f9r‹ó}¸¥¥¥ÿMº]¸‹UÎ3À‰E°‰EÔ‰EØ‰EÜ·C
‹ğ3uÎ¹ÿ  #Ñ#Áæ €  ¿ÿ  ‰u·Éf;×ƒ!  f;Çƒ  ¿ı¿  f;Ï‡
  ¾¿?  f;Îw3À‰EÈ‰EÄé  3öf;ÖuA÷EÌÿÿÿu9uÈu9uÄu3Àf‰EÎéë  f;Æu!A÷Cÿÿÿu9su93u‰uÌ‰uÈ‰uÄéÅ  ‰u˜}ØÇE¨   ‹E˜‹U¨À‰Uœ…Ò~RDÄ‰E¤C‰E ‹E ‹U¤·· ƒe´ ¯Â‹Wü4;òr;ğsÇE´   ƒ}´ ‰wütfÿƒE¤ƒm ÿMœƒ}œ »GGÿE˜ÿM¨ƒ}¨ ‘ÁÀ  f…É~7‹}Ü…ÿx+‹uØ‹EÔÑeÔÁè‹ÖöğÁê?ÂÁÿÿ  ‰uØ‰EÜf…ÉÎf…ÉMÁÿÿ  f…É}B‹Á÷Ø·ğÎöEÔtÿE°‹EÜ‹}Ø‹UØÑmÜÁàÑïø‹EÔÁâÑèÂN‰}Ø‰EÔuÑ9u°tfƒMÔ¸ €  ‹Ğf9UÔw‹UÔâÿÿ ú € u4ƒ}Öÿu+ƒeÖ ƒ}ÚÿuƒeÚ ºÿÿ  f9UŞuf‰EŞAëfÿEŞëÿEÚëÿEÖ¸ÿ  f;Èr#3À3Éf9E‰EÈ”Á‰EÄIá   €Á €ÿ‰MÌë;f‹EÖMf‰EÄ‹EØ‰EÆ‹EÜ‰EÊf‰MÎë3Àf…ö”ÀƒeÈ H%   € €ÿƒeÄ ‰EÌƒ}¬ …;ıÿÿ‹EÌ·MÄ‹uÆ‹UÊÁèë/ÇE”   ë3ö¸ÿ  º   €3ÉÇE”   ëÇE”   3É3À3Ò3ö‹}ˆEŒf‰f‰G
‹E”‰w‰W‹Mü_^3Í[è1ÿÿÉÃyB YyB ¯yB âyB 'zB _zB szB ÎzB ¹zB 8{B -{B ÜzB ‹ÿU‹ìƒìt¡Ü}C 3Å‰EüS‹]VWu}ğ¥¥f¥‹Eø‹Uø¹ €  #Á‰E Aÿ#Ğfƒ}  ‰]œÆEĞÌÆEÑÌÆEÒÌÆEÓÌÆEÔÌÆEÕÌÆEÖÌÆE×ÌÆEØÌÆEÙÌÆEÚûÆEÛ?ÇEŒ   tÆC-ëÆC ‹uô‹}ğf…Òu1…öu-…ÿu)3Àf9M f‰•ÀşÈ$ ˆCÆCÆC0ÆC 3À@é  f;Ğ…¡   3À@f‰¸   €;ğu…ÿt÷Æ   @uh C ëSfƒ}  tş   Àu…ÿu;høC ë;ğu0…ÿu,hğC CjPè}ºÿÿƒÄ3ö…ÀtVVVVVèsMÿÿƒÄÆCë*hèC CjPèQºÿÿƒÄ3ö…ÀtVVVVVèGMÿÿƒÄÆC3Àés  ·Ê‹ÙiÉM  Áë‹ÆÁèCkÀM„í¼ìÁø·À3É¿Øf‰Mà¹`C ÷Ûƒé`‰E´f‰Uê‰uæ‰}â‰M˜…Û„  }¸ÀC ÷Ûƒè`‰E˜…Û„†  ƒE˜T‹ËƒáÁû…É„h  kÉM˜‹Á‰M¼¹ €  f9r‹ğ}Ä¥¥EÄ¥ÿMÆ‰E¼3É‰M¸‰Mğ‰Mô‰Mø·H
‹Ñ3Uê¾ÿ  â €  ‰U¨‹Uê#Ö#Î4·ş¾ÿ  f;Öƒ­  f;Îƒ¤  ¾ı¿  f;ş‡–  ¾¿?  f;şw3ö‰uè‰uä‰uàéÓ  3öf;ÖuG÷Eèÿÿÿu9uäu9uàu3Àf‰Eêé­  f;ÎuG÷@ÿÿÿu	9pu90t´!u¬uôÇEÀ   ‹M¬‹UÀÉ‰U°…Ò~ULàƒÀ‰M‰E”‹E·‹E”· ‹Vü¯Èƒe¤ 
;Âr;ÁsÇE¤   ƒ}¤ ‰FütfÿƒEƒm”ÿM°ƒ}° »‹E¼FFÿE¬ÿMÀƒ}À ÇÀ  f…ÿ~;÷Eø   €u-‹Eô‹MğÑeğ‹ĞÀÁéÁ‰Eô‹EøÁêÀÂÇÿÿ  ‰Eøf…ÿÊf…ÿMÇÿÿ  f…ÿ}B‹Ç÷Ø·ÀøöEğtÿE¸‹Mø‹uô‹UôÑmøÁáÑîñ‹MğÁâÑéÊH‰uô‰MğuÑ9E¸tfƒMğ¸ €  ‹Èf9Mğw‹Mğáÿÿ ù € u4ƒ}òÿu+ƒeò ƒ}öÿuƒeö ¹ÿÿ  f9Múuf‰EúGëfÿEúëÿEöëÿEò¸ÿ  f;ø‚¬   3À3Éf9E¨‰Eä”Á‰EàIá   €Á €ÿ‰Mè3ö;Ş…zıÿÿ‹MèÁéºÿ?  ¸ÿ  f;Ê‚¤  ‹]ÚÿE´3Ò·É‰U°‰Uğ‰Uô‰Uø‹UÚ3Ù#È#Ğã €  ‹ø4
‰]¤·öf;ÏƒL  f;ĞƒC  ¸ı¿  f;ğ‡5  ¸¿?  f;ğwK3À‰Eä‰Eàé9  f‹Eò}¨f‰Eà‹Eô‰Eâ‹Eø‰Eæf‰}êéUÿÿÿ3À3öf9u¨”ÀH%   € €ÿ‰Eèé[ıÿÿ3Àf;ÈuF÷Eèÿÿÿu9Eäu9Eàu	f‰EêéÚ  f;ĞuF÷EØÿÿÿu9EÔu	9EĞ„vÿÿÿ‰E¬}ôÇEÀ   ‹E¬‹MÀÀ‰M¸…É~JMØ‰M¨Dà‹M¨··	ƒe¼ ¯Ê‹Wü
;Úr;ÙsÇE¼   ƒ}¼ ‰_ütfÿƒm¨@@ÿM¸ƒ}¸ ÀGGÿE¬ÿMÀƒ}À ™ÆÀ  f…ö~7‹}ø…ÿx+‹Eô‹MğÑeğ‹ĞÀÁéÁ‰EôÁê?ÂÆÿÿ  ‰Eøf…öÎf…öMÆÿÿ  f…ö}B‹Æ÷Ø·ÀğöEğtÿE°‹Mø‹}ô‹UôÑmøÁáÑïù‹MğÁâÑéÊH‰}ô‰MğuÑ9E°tfƒMğ¸ €  ‹Èf9Mğw‹Mğáÿÿ ù € u4ƒ}òÿu+ƒeò ƒ}öÿuƒeö ¹ÿÿ  f9Múuf‰EúFëfÿEúëÿEöëÿEò¸ÿ  f;ğr#3À3Éf9E¤‰Eä”Á‰EàIá   €Á €ÿ‰Mèë;f‹Eòu¤f‰Eà‹Eô‰Eâ‹Eø‰Eæf‰uêë3Àf…Û”Àƒeä H%   € €ÿƒeà ‰EèöE‹Uœ‹E´‹}f‰t2˜ø…ÿ+3Àf‰¸ €  f9E ÆB•ÀşÈ$ ˆBÆB0ÆB é_ùÿÿƒÿ~j_‹uèÁîîş?  3Àf‰EêÇE¼   ‹Eà‹]ä‹MäÑeàÁèÛØ‹EèÁéÀÁÿM¼‰]ä‰EèuØ…ö}2÷Şæÿ   ~(‹Eè‹]ä‹MäÑmèÁàÑëØ‹EàÁáÑèÁN‰]ä‰Eà…öØGZ‰]À‰E´…Àµ   ‹Uà‹Eäuà}Ä¥¥¥Ñeà‹}àÑeàÁê Ê‹Uè‹ğÁîÒÖ‹Á4	Áè‹UÄÁïÈ‹Eà÷<;ør;úsF3Ò;Ærƒøs3ÒB‹ğ…ÒtA‹EÈ0‰U¼;Ör;ĞsAMÌÁêÉÊ4?‰uà‹u¼‰MèÁéö€Á0‹ÇÁèğˆCÿM´ƒ}´ ‰uäÆEë KÿÿÿKŠK<5}‹MÀëD€;9u	Æ0K;]Àsò‹Eœ;]ÀsCfÿ ş*Ø€ë¾ËˆXÆD ‹EŒ‹Mü_^3Í[è	ÿÿÉÃ€;0uK;Ùsö‹Eœ;ÙsÍ3Òf‰º €  f9U Æ@•ÂşÊ€â€Â ˆPÆ0Æ@ é÷ÿÿ3ÀöÃt@öÃtƒÈöÃtƒÈöÃtƒÈöÃtƒÈ ÷Ã   tƒÈ‹Ëº   #ÊV¾   t#ù   t;Ît;Êu   ë   ë   ‹Ëá   tù   uÆëÂ^÷Ã   t   Ã3ÀöÂt¸€   SVW»   öÂtÃöÂt   öÂt   öÂt   ¿   ÷Â   tÇ‹Ê¾   #Ît;Ït;Ët;Îu `  ë @  ë    ¹   _#Ñ^[ú   tú   t
;Ñu €  ÃƒÈ@Ã@€  Ã‹ÿU‹ìƒìSVW›Ù}ø‹]ø3ÒöÃtjZöÃtƒÊöÃtƒÊöÃtƒÊöÃ tƒÊöÃtÊ   ·Ë‹Á¾   #Æ¿   t$=   t=   t;Æu×ëÊ   ëÊ   #Ïtù   uÊ   ëÊ   ÷Ã   tÊ   ‹}‹M‹Ç÷Ğ#Â#ÏÁ‰E;Â„®   ‹Øè
şÿÿ·À‰EüÙmü›Ù}ü‹]ü3ÒöÃtjZöÃtƒÊöÃtƒÊöÃtƒÊöÃ tƒÊöÃtÊ   ·Ë‹Á#Æt(=   t=   t;ÆuÊ   ëÊ   ëÊ   á   tù   uÊ   ëÊ   ÷Ã   tÊ   ‰U‹Â3ö95¸¿C „  ç‰}ì®]ğ‹Eğ„Àyj^©   tƒÎ©   tƒÎ©   tƒÎ©   tƒÎ©   tÎ   ‹È» `  #Ët*ù    tù @  t;ËuÎ   ëÎ   ëÎ   ¿@€  #Çƒè@t-À  tƒè@uÎ   ëÎ   ëÎ   ‹Eì‹Ğ#E÷Ò#ÖĞ;Öu‹Æé°   èı/**
 * Romanian translation for bootstrap-datetimepicker
 * Cristian Vasile <cristi.mie@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['ro'] = {
		days: ["DuminicÄƒ", "Luni", "MarÅ£i", "Miercuri", "Joi", "Vineri", "SÃ¢mbÄƒtÄƒ", "DuminicÄƒ"],
		daysShort: ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "SÃ¢m", "Dum"],
		daysMin: ["Du", "Lu", "Ma", "Mi", "Jo", "Vi", "SÃ¢", "Du"],
		months: ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"],
		monthsShort: ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"],
		today: "AstÄƒzi",
		suffix: [],
		meridiem: [],
		weekStart: 1
	};
}(jQuery));
                                                                                                                                                                                                                                                                                                                      ÿs · ÿs ¸ ÿs ¸ ÿs ¹ ÿš ¹ ÿš º ÿš º ÿš » ÿš » ÿš Ì ÿ‡ Ì ÿ‡      Ô	 						
					
		
				
 	



	
			
	

	





 




					
		 				
					

				

												 		
	
	




		
	
	

								



			 			


	
	
		
	







			


 	
		



	
	






 
	
	

	

	
	


	 
	


	
				 			

		


 
				
	


 
 


					
	 		
	! 	



			
		!							# 	



					#
	
				$ 
	



	
				

$


			



& 
		
			


				
&


			



  ,  š3  %š3    f                           Alts @  ğ]ıš K]Z        ˆº–_<õ       ¬9;    ¬9;üuı¦U]            ]ıš KœüuúøU                Ò    Ò À        @ 
   ©6                                                                                                                                                                                                                                                                                                                                                                                                                                          À(C     8|C        ÿÿÿÿ    @   ä%C             X|C 8&C            H&C T&C À(C     X|C        ÿÿÿÿ    @   8&C             l|C „&C            ”&C œ&C     l|C         ÿÿÿÿ    @   „&C             x{C $C             ˆ|C à&C            ğ&C  'C 0C À(C     ˆ|C        ÿÿÿÿ    @   à&C             ä|C 0'C            @'C L'C À(C     ä|C        ÿÿÿÿ    @   0'C 4}C        ÿÿÿÿ    @   „'C            ”'C h'C À(C                 4}C „'C             À}C È'C            Ø'C à'C     À}C         ÿÿÿÿ    @   È'C             |ŠC (C             (C ,(C H(C     |ŠC        ÿÿÿÿ    @   (C œŠC         ÿÿÿÿ    @   d(C            t(C H(C                 œŠC d(C             X‘C ¤(C            ´(C ô(C À(C     @‘C         ÿÿÿÿ    @   Ü(C            ì(C À(C     X‘C        ÿÿÿÿ    @   ¤(C            è‘C 8)C             è‘C 8)C           H)C X*C ì)C Ğ)C |)C `)C     °‘C        ÿÿÿÿ    B   @*C ˆ‘C       ÿÿÿÿ    @   ˜)C            ¨)C ´)C $*C     ˆ‘C        ÿÿÿÿ    @   ˜)C °‘C         ÿÿÿÿ    B   @*C È‘C        ÿÿÿÿ    @   *C            *C ì)C $*C     °‘C         ÿÿÿÿ    @   @*C            P*C $*C     è‘C        ÿÿÿÿ    @   8)C              ’C ˆ*C            ˜*C à*C ¨*C $*C     ’C        ÿÿÿÿ    @   Ä*C            Ô*C ¨*C $*C      ’C        ÿÿÿÿ    @   ˆ*C             \’C +C             +C h+C 0+C $*C     @’C        ÿÿÿÿ    @   L+C            \+C 0+C $*C     \’C        ÿÿÿÿ    @   +C              ’C ˜+C            ¨+C ğ+C ¸+C À(C     „’C        ÿÿÿÿ    @   Ô+C            ä+C ¸+C À(C      ’C        ÿÿÿÿ    @   ˜+C             Ø’C  ,C            0,C 8,C     Ø’C         ÿÿÿÿ    @    ,C             “C h,C            x,C Ô,C „,C     ô’C        ÿÿÿÿ    @    ,C            °,C ¸,C     ô’C         ÿÿÿÿ    @    ,C “C        ÿÿÿÿ    @   h,C             <“C -C            -C $-C ¸+C À(C     <“C        ÿÿÿÿ    @   -C             X“C T-C            d-C t-C ¸+C À(C     X“C        ÿÿÿÿ    @   T-C             x“C ¤-C            ´-C Ä-C ¸+C À(C     x“C        ÿÿÿÿ    @   ¤-C             ˜“C ô-C            .C .C ¸+C À(C     ˜“C        ÿÿÿÿ    @   ô-C             ´“C D.C            T.C d.C ¸+C À(C     ´“C        ÿÿÿÿ    @   D.C ü¡ £ @« L X H  n  Â  ó  $¡ G¡ “¡ ¶¡ Ú¡ ¢ &¢ A¢ d¢ ‡¢ ¬¢ Ç¢ í¢ 5£ X£ ~£ ®£ É£ ï£ ¤ H¤ n¤ ‰¤ ¯¤ ß¤ ¥ @¥ c¥ ¥ Ô¥ ø¥ ¦ O¦ u¦ ¥¦ É¦ ö¦ § 7§ x§ “§ ®§ Ù§ ÿ§ '¨ c¨ Ÿ¨ è¨ )© \© © Ì© ª ª Sª xª ¨ª Øª « ;« h« š« Ê« û« +¬ ]¬ ¬ »¬ ÷¬ (­ t­ ˜­ È­ ® 0® ‚® ¹® ù® (¯ Z¯ ‹¯ Æ¯ ° H° €° ¨° à° 7± h± «± à± ² H² ƒ² ğ² 0³ €³ ¨³ ñ³ A´ {´ ¸´ ë´                 ÿÿÿÿ@ B "“   P0C                            ¼’C äûÿÿ—@               |0C ÿÿÿÿ    ÿÿÿÿ       c B "“    0C    Œ0C                ÿÿÿÿ– B     ¡ B ÿÿÿÿ¬ B    · B "“   Ü0C                                    01C    D1C `1C |1C ˜1C    °pC     ÿÿÿÿ              ¼’C     ÿÿÿÿ              ÌpC     ÿÿÿÿ              äpC     ÿÿÿÿ                       Ä1C    Ü1C ø1C `1C |1C ˜1C    ôpC     ÿÿÿÿ              qC     ÿÿÿÿ                       $2C    <2C ø1C `1C |1C ˜1C    4qC     ÿÿÿÿ                       h2C    €2C ø1C `1C |1C ˜1C    \qC     ÿÿÿÿ           ÿÿÿÿê B "“   œ2C                        ÿÿÿÿ¡B     ¡B "“   È2C                        ÿÿÿÿ?¡B "“   ü2C                            ôpC èÿÿÿõ§@             (3C "“   p3C    83C                ÿÿÿÿb¡B     m¡B                  x¡B    ¡B    Š¡B şÿÿÿ    Ìÿÿÿ    şÿÿÿ    6¹@     şÿÿÿ    Ìÿÿÿ    şÿÿÿ    Ê¹@     şÿÿÿ    Ìÿÿÿ    şÿÿÿ    ^º@     şÿÿÿ    Ìÿÿÿ    şÿÿÿ    »@     şÿÿÿ    Ìÿÿÿ    şÿÿÿ    ¤»@     şÿÿÿ    Ìÿÿÿ    şÿÿÿ    2¼@ ÿÿÿÿ®¡B "“   d4C                        ÿÿÿÿÑ¡B "“   4C                        ÿÿÿÿõ¡B "“   ¼4C                        şÿÿÿ    Ìÿÿÿ    şÿÿÿ    ÕÌ@     şÿÿÿ    Èÿÿÿ    şÿÿÿ    ŠÍ@ ÿÿÿÿ¢B "“   $5C                            ¼’C ìÿÿÿQÛ@ ÿÿÿÿ    ÿÿÿÿ                  P5C "“   `5C    p5C                ÿÿÿÿ\¢B "“   ¨5C                        ÿÿÿÿ¢B "“   Ô5C                            ¼’C àÿÿÿCå@               6C ÿÿÿÿ        ¢¢B ÿÿÿÿ    "“   $6C    6C                    ¼’C äÿÿÿnç@ ÿÿÿÿ    ÿÿÿÿ                  `6C "“   p6C    €6C                ÿÿÿÿâ¢B "“   ¸6C                        ÿÿÿÿ£B     £B    %£B     -£B "“   ä6C                        ÿÿÿÿP£B "“   (7C                            ¼’C äûÿÿ‡ô@               T7C ÿÿÿÿ    ÿÿÿÿ       s£B "“   x7C    d7C                ÿÿÿÿ¦£B "“   ´7C                            ¼’C ÄÿÿÿØö@ ÿÿÿÿ    ÿÿÿÿ                  à7C "“   ğ7C     8C                ÿÿÿÿä£B "“   88C                        ÿÿÿÿ
¤B     ¤B "“   d8C                            ¼’C èÿÿÿÉA              ˜8C ÿÿÿÿ        8¤B    @¤B ÿÿÿÿ    "“   ¼8C    ¨8C                ÿÿÿÿc¤B "“    9C                                    <9C    P9C `1C |1C ˜1C    „yC     ÿÿÿÿ               ¼’C èÿÿÿÏA ÿÿÿÿ    ÿÿÿÿ                  l9C "“   |9C    Œ9C                ÿÿÿÿ¤¤B "“   Ä9C                        ÿÿÿÿ×¤B "“   ğ9C                            ¼’C àûÿÿ9#A             :C ÿÿÿÿú¤B                    ¥B "“   @:C    ,:C                            ”:C    ¨:C `1C |1C ˜1C    ¤zC     ÿÿÿÿ           ÿÿÿÿ8¥B "“   Ä:C                        äÿÿÿ    Ìÿÿÿ    şÿÿÿ/A ²/A ÿÿÿÿ[¥B "“   ;C                            ¼’C ¤ÿÿÿ6A             8;C ÿÿÿÿ~¥B     †¥B               "“   \;C    H;C                ÿÿÿÿ³¥B     ¾¥B    É¥B "“    ;C                        ÿÿÿÿï¥B "“   Ü;C                        ÿÿÿÿ¦B "“   <C                                      `<C ÿÿÿÿ    ÿÿÿÿ       G¦B     °pC Ôÿÿÿ’>A     ¼’C Øÿÿÿª>A "“   H<C    4<C                ÿÿÿÿj¦B "“   ¤<C                        ÿÿÿÿ¦B "“   Ğ<C                            ¼’C ØÿÿÿMA             ü<C ÿÿÿÿÀ¦B ÿÿÿÿ    ÿÿÿÿ    "“    =C    =C                ÿÿÿÿä¦B ÿÿÿÿí¦B "“   \=C                            ¼’C àÿÿÿÆSA ÿÿÿÿ    ÿÿÿÿ                  =C "“    =C    °=C                    ¼’C äûÿÿıWA               è=C ÿÿÿÿ    ÿÿÿÿ       ,§B "“   >C    ø=C                ÿÿÿÿ_§B "“   H>C                            ¼’C ìÿÿÿÑYA ÿÿÿÿ    ÿÿÿÿ                  t>C "“   „>C    ”>C                    ¼’C äÿÿÿ£\A ÿÿÿÿ    ÿÿÿÿ                  Ì>C "“   Ü>C    ì>C                ÿÿÿÿÉ§B "“   $?C                            ¼’C äûÿÿ<dA               P?C ÿÿÿÿ    ÿÿÿÿ       ô§B "“   t?C    `?C                            À?C    Ø?C ø1C `1C |1C ˜1C    àwC     ÿÿÿÿ               ¼’C ìÿÿÿŞoA ÿÿÿÿ    ÿÿÿÿ                  ô?C "“   @C    @C                ÿÿÿÿB¨B     M¨B    X¨B "“   L@C                            ôpC ÌıÿÿÀwA             ˆ@C "“   Ğ@C    ˜@C                ÿÿÿÿ~¨B     ‰¨B            ”¨B         ÿÿÿÿÇ¨B     Ò¨B    İ¨B     İ¨B "“   ø@C                            ¼’C àûÿÿ·~A             <AC ÿÿÿÿ©B                    ©B "“   `AC    LAC                ÿÿÿÿQ©B "“   ¤AC                        ÿÿÿÿ„©B "“   ĞAC                        ÿÿÿÿª©B "“   üAC                        ÿÿÿÿô©B     ü©B "“   (BC                                    lBC    €BC `1C |1C ˜1C    ¨|C     ÿÿÿÿ               şÿÿÿ    ˆÿÿÿ    şÿÿÿ?‘A C‘A şÿÿÿ‘A ‘A şÿÿÿ    Ôÿÿÿ    şÿÿÿ    &™A     şÿÿÿ    Ôÿÿÿ    şÿÿÿ    ß™A     şÿÿÿ    Èÿÿÿ    şÿÿÿ    zœA     şÿÿÿ    Ôÿÿÿ    şÿÿÿ    ¾ŸA     şÿÿÿ    Ôÿÿÿ    şÿÿÿ    ç A     şÿÿÿ    Ğÿÿÿ    şÿÿÿ    g§A     şÿÿÿ    Ğÿÿÿ    şÿÿÿ    `²A     şÿÿÿ    Ğÿÿÿ    şÿÿÿ    K³A     şÿÿÿ    Œÿÿÿ    şÿÿÿÁÂA ÅÂA     şÿÿÿ    Ôÿÿÿ    şÿÿÿ    ZÅA şÿÿÿ    iÅA şÿÿÿ    Øÿÿÿ    şÿÿÿ    ÇA şÿÿÿ    (ÇA şÿÿÿ    Ôÿÿÿ    şÿÿÿ    ÈîA     şÿÿÿ    Ìÿÿÿ    şÿÿÿ    –òA     şÿÿÿ    Ôÿÿÿ    şÿÿÿ    öA     şÿÿÿ    Ôÿÿÿ    şÿÿÿ    .÷A     şÿÿÿ    Ôÿÿÿ    şÿÿÿ    ñüA     şÿÿÿ    Øÿÿÿ    şÿÿÿkşA şA     şÿÿÿ    Øÿÿÿ    şÿÿÿ½şA ÁşA     şÿÿÿ    Øÿÿÿ    şÿÿÿÿA ÿA     şÿÿÿ    Àÿÿÿ    şÿÿÿ    B     şÿÿÿ    Ğÿÿÿ    şÿÿÿ’B ©B     şÿÿÿ    Ğÿÿÿ    şÿÿÿ    „B     FB PB şÿÿÿ    Øÿÿÿ    şÿÿÿ-B 6B @           B ÿÿÿÿ    ÿÿÿÿ                  ¼EC "“   ÌEC    ÜEC                    şÿÿÿ    ´ÿÿÿ    şÿÿÿ    LB     ¼B ÅB şÿÿÿ    Ôÿÿÿ    şÿÿÿ3B 7B     şÿÿÿ    Øÿÿÿ    şÿÿÿÌB ĞB     êB     ŒFC    ˜FC ´FC     |ŠC     ÿÿÿÿ       ‚B     œŠC     ÿÿÿÿ       ½WB şÿÿÿ    Ôÿÿÿ    şÿÿÿB 3B     şÿÿÿ    ´ÿÿÿ    şÿÿÿ    õ0B     şÿÿÿ    Øÿÿÿ    şÿÿÿ    ©5B     şÿÿÿ    Ôÿÿÿ    şÿÿÿ    ê5B     şÿÿÿ    Ôÿÿÿ    şÿÿÿ    ©7B     şÿÿÿ    Ìÿÿÿ    şÿÿÿ    ´>B     şÿÿÿ    Ğÿÿÿ    şÿÿÿ    ÃFB     şÿÿÿ    Ğÿÿÿ    şÿÿÿ    UB     şÿÿÿ    Ìÿÿÿ    şÿÿÿ    ’VB         ^VB şÿÿÿ    Ôÿÿÿ    şÿÿÿ     cB     şÿÿÿ    Ôÿÿÿ    şÿÿÿ    ?lB     şÿÿÿ    Ğÿÿÿ    şÿÿÿ    !mB     şÿÿÿ    Ğÿÿÿ    şÿÿÿ    €B     şÿÿÿ    Øÿÿÿ    şÿÿÿ¶’B Ò’B     şÿÿÿ    Ôÿÿÿ    şÿÿÿ(B <B ÿÿÿÿ@ªB     HªB "“   ´HC                        ÿÿÿÿpªB "“   èHC                        ÿÿÿÿ ªB "“   IC                        ÿÿÿÿĞªB "“   @IC                        ÿÿÿÿ «B "“   lIC                        ÿÿÿÿ0«B "“   ˜IC                        ÿÿÿÿ`«B "“   ÄIC                        ÿÿÿÿ«B "“   ğIC                        ÿÿÿÿÀ«B "“   JC                        ÿÿÿÿğ«B "“   HJC                        ÿÿÿÿ ¬B "“   tJC                            ¼’C ìÿÿÿ^.@              JC ÿÿÿÿP¬B     X¬B               "“   ÄJC    °JC                    ¼’C Üÿÿÿx@             KC ÿÿÿÿ€¬B ÿÿÿÿŠ¬B               "“   ,KC    KC                ÿÿÿÿ°¬B "“   pKC                            ¼’C ìÿÿÿ0@             œKC "“   äKC    ¬KC                ÿÿÿÿà¬B     è¬B           í¬B        ÿÿÿÿ ­B "“   LC                        ÿÿÿÿP­B     X­B    f­B "“   8LC                        ÿÿÿÿ­B "“   tLC                        ÿÿÿÿÀ­B "“    LC                        ÿÿÿÿğ­B ÿÿÿÿú­B "“   ÌLC                        ÿÿÿÿ ®B ÿÿÿÿ(®B ÿÿÿÿ    "“    MC                        ÿÿÿÿP®B     X®B    f®B    t®B "“   <MC                        ÿÿÿÿ ®B "“   €MC                        ÿÿÿÿà®B "“   ¬MC                        ÿÿÿÿ ¯B "“   ØMC                        ÿÿÿÿP¯B "“   NC                        ÿÿÿÿ€¯B "“   0NC                        ÿÿÿÿ°¯B ÿÿÿÿ»¯B ÿÿÿÿ    "“   \NC                        ÿÿÿÿ °B     °B     °B "“   ˜NC                        ÿÿÿÿ@°B "“   ÔNC                        ÿÿÿÿp°B ÿÿÿÿx°B "“    OC                        ÿÿÿÿ °B "“   4OC                        ÿÿÿÿĞ°B     Ø°B "“   `OC                            ¼’C Ìÿÿÿ€@             ”OC "“   ÜOC    ¤OC                ÿÿÿÿ±B ÿÿÿÿ±B           ±B    '±B    /±B        ÿÿÿÿ`±B "“   PC                        ÿÿÿÿ±B     ˜±B     ±B "“   @PC                        ÿÿÿÿĞ±B     Ø±B "“   |PC                        ÿÿÿÿ ²B "“   °PC                        ÿÿÿÿ@²B "“   ÜPC                        ÿÿÿÿp²B     {²B "“   QC                        "“   `QC                        ÿÿÿÿÀ²B     È²B    Ğ²B    Ø²B    à²B    è²B ÿÿÿÿ³B     ³B     ³B    (³B "“   QC                        "“   øQC                        ÿÿÿÿP³B     X³B    `³B    h³B    p³B    x³B ÿÿÿÿ ³B "“   (RC                        ÿÿÿÿĞ³B     Û³B    æ³B "“   TRC                        ÿÿÿÿ ´B     +´B     6´B "“   RC                        ÿÿÿÿp´B "“   ÌRC                        ÿÿÿÿ°´B "“   øRC                        ÿÿÿÿà´B "“   $SC                           À ğ¾ ø“ S ÌS                                         ¸S œS       CreateStdAccessibleObject   LresultFromObject             4U          b ”À €W         òg àÂ ÔT         di 4À ÌT         ~i ,À èX         Âi HÄ  T         tj  À lW         Îj ÌÂ øX         Fk XÄ <W         Pk œÂ                     bj Tj Dj 2j $j j j ği ài Ği     ni     Fi Ri 2i  i 
i öh àh Ìh ¼h ²h ¦h ˜h şg ~h rh hh Xh Jh :h ,h h h Œh     ¸^ Ò^ è^ ø^ _ _ $_ 0_ <_ J_ \_ n_ ~_ _ _ ª_ È_ Ş_ ø_ ` $` 6` D` ª^ l` |` –` ª` Æ` Ú` æ` ğ` ü` a 6a Pa `a ra ‚a ’a ¤a ¶a Èa Øa èa øa b –^ ~^ l^ `^ L^ :^ ,^ ^ ^ ^ ä] Ğ] Â] ¸]  ] ] ‚] v] Z] J] :] "] ] ü\ î\ Ö\ À\ °\ œ\ „\ j\ X\ F\ 4\ \ \ ú[ î[ Ø[ Æ[ ´[  [ [ ~[ n[ b[ R[ D[ ,[ [ 
[ úZ ìZ ŞZ ĞZ ÀZ ®Z ¢Z –Z ˆZ |Z fZ PZ :Z ,Z Z Z úY ìY ÖY ºY ªY šY ’Y ~Y lY VY FY 6Y &Y R` Y       €  €
  €	  €  €  €·  €¢  €  €  €¡  €    ¬j Àj ‚j –j     äg Øg Êg ¼g °g g Œg ~g pg ^g Pg Hg <g (g g úf èf Òf ´f ˜f †f hf Xf Hf .f "f f f ôe âe Òe Âe ¶e ªe œe e „e re \e Fe 8e (e e e öd äd Öd Ìd .b <b Nb jb ¼d ¦d ”d „d td bd Pd @d .d ¦f zb b ¢b °b Äb Ôb äb úb c c *c @c Lc dc tc †c ˜c ¢c  d 
d şc îc Şc Ìc ºc ®c vf     œi ²i Œi     0k k k üj êj Új      SizeofResource  LockResource  öLoadResource  9FindResourceW MultiByteToWideChar pGetCommandLineW ùGetModuleHandleW  !Sleep £ CreateThread  ;GetStdHandle  ExpandEnvironmentStringsW õGetModuleFileNameW  ExitProcess hReadFile  ßSetFilePointer  AFlushFileBuffers  ×GetFileType zWideCharToMultiByte ™GetConsoleOutputCP  ¼SetConsoleOutputCP  WriteFile C CloseHandle ¶lstrlenW  ıLocalFree HFormatMessageW  —GlobalUnlock  GlobalLock  …GlobalAlloc ŒGlobalFree  ìSetLastError  æGetLastError   GetProcAddress  ¼InterlockedDecrement  LFreeLibrary uGetVersionExA ªlstrcmpW  ñLoadLibraryA  U CompareStringW  ôLoadLibraryW  ‡GlobalDeleteAtom  ‰GlobalFindAtomW „GlobalAddAtomW  ­GetCurrentThreadId  ©lstrcmpA  µlstrlenA  ÀInterlockedIncrement  ½InterlockedExchange R CompareStringA  óLoadLibraryExW  êGetLocaleInfoW  é EnumResourceLanguagesW  Z ConvertDefaultLocale  ¬GetCurrentThread  ÒSetErrorMode  ªGetCurrentProcessId FileTimeToSystemTime  ùLocalAlloc  ïLeaveCriticalSection  4TlsGetValue Ù EnterCriticalSection  “GlobalReAlloc GlobalHandle  ´InitializeCriticalSection 2TlsAlloc  5TlsSetValue  LocalReAlloc  ¾ DeleteCriticalSection 3TlsFree ‹GlobalFlags öGetModuleHandleA  “WritePrivateProfileStringW  LockFile  ?UnlockFile  ÍSetEndOfFile  ÔGetFileSize Ô DuplicateHandle ©GetCurrentProcess FindClose $FindFirstFileW  yGetVolumeInformationW ßGetFullPathNameW   CreateFileW FileTimeToLocalFileTime ÎGetFileAttributesW  ÕGetFileSizeEx ÖGetFileTime :GetStartupInfoW HeapAlloc ¡HeapFree  ’RtlUnwind ¤HeapReAlloc ZRaiseException  ZVirtualProtect  TVirtualAlloc  IGetSystemInfo \VirtualQuery  ¦HeapSize  SetUnhandledExceptionFilter ôGetModuleFileNameA  KFreeEnvironmentStringsW ÁGetEnvironmentStringsW  èSetHandleCount  9GetStartupInfoA ŸHeapCreate  WVirtualFree TQueryPerformanceCounter fGetTickCount  OGetSystemTimeAsFileTime -TerminateProcess  >UnhandledExceptionFilter  ÑIsDebuggerPresent [GetCPInfo RGetACP  GetOEMCP  ÛIsValidCodePage µInitializeCriticalSectionAndSpinCount kGetTimeZoneInformation  ƒGetConsoleCP  •GetConsoleMode  áLCMapStringA  ãLCMapStringW  =GetStringTypeA  @GetStringTypeW  èGetLocaleInfoA  üSetStdHandle  ‚WriteConsoleA ŒWriteConsoleW x CreateFileA ĞSetEnvironmentVariableA KERNEL32.dll  ÿMessageBoxW ù GetActiveWindow MsgWaitForMultipleObjects PeekMessageW  ÕTranslateMessage  © DispatchMessageW  kGetSubMenu  BGetMenuItemCount  CGetMenuItemID GGetMenuState  ÙUnhookWindowsHookEx }GetWindow oGetSystemMetrics  ˆGetWindowRect ‡GetWindowPlacement  ½IsIconic  ÄSystemParametersInfoA §SetWindowPos  ¥SetWindowLongW  ‚GetWindowLongW  <GetMenu )PtInRect  O CopyRect   CallWindowProcW – DefWindowProcW  cSendMessageW  GetDlgCtrlID  UGetParent  AdjustWindowRectEx  lGetSysColor 6RegisterClassW  GetClassInfoW GetClassInfoExW h CreateWindowExW PostMessageW  GetClientRect ÊIsWindowVisible zSetForegroundWindow Ñ EnableWindow  SetMenu 1GetKeyState óMapWindowPoints LGetMessagePos MGetMessageTime    DestroyWindow uGetTopWindow  GetDlgItem  8GetLastActivePopup  %GetForegroundWindow GetWindowTextW  ÅIsWindow  $GetFocus  PRemovePropW \GetPropW  SetPropW  GetClassNameW 	GetClassLongW  CallNextHookEx  °SetWindowsHookExW GetCapture   WinHelpW  ×LoadIconW JRegisterWindowMessageW  òValidateRect  GetCursorPos  NGetMessageW = CheckMenuItem Ï EnableMenuItem  ModifyMenuW ÑLoadBitmapW >GetMenuCheckMarkDimensions  ƒSetMenuItemBitmaps   PostQuitMessage ÆIsWindowEnabled GetWindowThreadProcessId  mGetSysColorBrush  LReleaseDC GetDC ÕLoadCursorW ¬SetWindowTextW  ¸ShowWindow   DestroyMenu E ClientToScreen  ÇTabbedTextOutW  È DrawTextW Ç DrawTextExW ”GrayStringW pSetCursor : CharUpperW  USER32.dll  µGetDeviceCaps ªGetClipBox  SetTextColor  eSetBkColor  ( CreateBitmap  #ExtTextOutW Ğ DeleteObject  WSaveDC  PRestoreDC {SetMapMode  APtVisible ERectVisible  TextOutW  Escape  ^SelectObject  SetViewportOrgEx  %OffsetViewportOrgEx SetViewportExtEx  XScaleViewportExtEx  “SetWindowExtEx  YScaleWindowExtEx  Í DeleteDC  ôGetStockObject  GDI32.dll 
 GetFileTitleW COMDLG32.dll   ClosePrinter  N DocumentPropertiesW  OpenPrinterW  WINSPOOL.DRV  [RegOpenKeyExW IRegEnumKeyExW hRegQueryValueExW  *RegCloseKey 3RegCreateKeyExW ^RegOpenKeyW iRegQueryValueW  >RegDeleteKeyW JRegEnumKeyW xRegSetValueExW  ADVAPI32.dll  I PathFindFileNameW G PathFindExtensionW  — PathStripToRootW  q PathIsUNCW  SHLWAPI.dll = CoInitialize   CLSIDFromProgID  CoCreateInstance  4 CoGetObject ;StringFromGUID2  CoDisconnectObject  ole32.dll OLEAUT32.dll                                                                                                                                                                    Œ’@ ÅB        o“@ ˜ÔB     $”C ÈçB     .?AVCStringArray@@  ÈçB     .?AVCAfxStringMgr@@ ÈçB     .?AUIAtlStringMgr@ATL@@ ÈçB     .?AVCOleException@@ ÈçB     .?AVCException@@    ÈçB     .PAVCOleException@@ ÈçB     .PAVCObject@@   ÈçB     .PAX    ÈçB     .PAVCMemoryException@@  ÈçB     .PAVCSimpleException@@  ÈçB     .PAVCNotSupportedException@@    ÈçB     .PAVCInvalidArgException@@  ÈçB     .?AVCSimpleException@@  ÈçB     .?AVCMemoryException@@  ÈçB     .?AVCNotSupportedException@@    ÈçB     .?AVCInvalidArgException@@      ŒÇB                                                                                                                                                                                                                                                                                 #ğ  ¨ÇB                                                                                                                                                                                                                                                                                 !ğ  ÄÇB                                                                                                                                                                                                                                                                                 %ğ  ÈçB     .?AV_AFX_THREAD_STATE@@ ÈçB     .?AVCNoTrackObject@@    ÈçB     .?AVAFX_MODULE_THREAD_STATE@@   ÈçB     .?AVAFX_MODULE_STATE@@  ÈçB     .?AVCDllIsolationWrapperBase@@  ÈçB     .?AVCComCtlWrapper@@    ÈçB     .?AVCCommDlgWrapper@@   ÈçB     .?AVCShellWrapper@@ ÈçB     .?AV_AFX_BASE_MODULE_STATE@@        xìÿÿwìÿÿvìÿÿuìÿÿtìÿÿsìÿÿrìÿÿqìÿÿpìÿÿoìÿÿnìÿÿmìÿÿlìÿÿkìÿÿjìÿÿiìÿÿhìÿÿgìÿÿfìÿÿ    pÊB „ÊB  ÊB ´ÊB ÄÊB ØÊB øÊB ËB ËB ,ËB HËB pËB „ËB  ËB ÄËB ØËB ğËB ÌB  ÌB ÈçB     .?AVXAccessible@CWnd@@  ÈçB     .?AVXAccessibleServer@CWnd@@    ÈçB     .?AVCWnd@@  ÈçB     .?AV_AFX_HTMLHELP_STATE@@   ÈçB     .?AVCTestCmdUI@@    ÈçB     .?AVCCmdUI@@    ÈçB     .PAVCUserException@@    ÈçB     .?AV?$IAccessibleProxyImpl@VCAccessibleProxy@ATL@@@ATL@@    ÈçB     .?AUIAccessible@@   ÈçB     .?AUIAccessibleProxy@@  ÈçB     .?AV?$CMFCComObject@VCAccessibleProxy@ATL@@@@   ÈçB     .?AVCAccessibleProxy@ATL@@      ÈçB     .?AV?$CComObjectRootEx@VCComSingleThreadModel@ATL@@@ATL@@   ÈçB     .?AVCComObjectRootBase@ATL@@    ÈçB     .?AUIOleWindow@@    ÈçB     .?AVCWinThread@@    ÈçB     .PAVCArchiveException@@ ÈçB     .?AVCArchiveException@@ ÿÿÿÿÿÿÿÿÿÿÿÿ   xÖB ôyC ×B ,zC (ØB <zC         ğÖB    üÖB    ×B    (×B    X×B     €×B @           ØB             ØB €   ¸ØB    ÔØB            ÈçB     .?AVCWinApp@@   ÈçB     .?AV?$CArray@VCVariantBoolPair@@ABV1@@@ ÈçB     .PAVCOleDispatchException@@ ÈçB     .?AVCOleDispatchImpl@@  ÈçB     .?AVCOleDispatchException@@ ÈçB     .?AVCTypeLibCacheMap@@  ÈçB     .?AVCMapPtrToPtr@@  ÈçB     .?AVCPtrArray@@ ÈçB     .?AVCMemFile@@  ÈçB     .?AVCFile@@ ÈçB     .?AV?$CArray@W4LoadArrayObjType@CArchive@@ABW412@@@ ÈçB     .?AUCThreadData@@   ÈçB     .?AVCGdiObject@@    ÈçB     .?AVCMenu@@ ÈçB     .?AVCResourceException@@    ÈçB     .?AVCUserException@@    ÈçB     .?AVCDC@@   ÈçB     .?AVCHandleMap@@    ÈçB     .?AVCFileException@@    ÈçB     .PAVCFileException@@    ÔáB        ¥A ˜ÔB     è²C ÈçB     .?AVCByteArray@@    A p a r t m e n t   B o t h     F r e e     ÿÿÿÿÿÿÿÿÈçB     .?AVCObArray@@     €   €        œZÜŠèŞM¥¡`ø* ®÷óâ´À!ºsGº3^ÉFë‹Û5—}+E‰ut¨X(ÓTBf6×—K›ƒt„©Ğ3pçB        {A ˜ÔB     ê²C    ´çB ÈçB     .?AVtype_info@@ ¨œA Næ@»±¿D                                     	               	      
                                                !      5      A      C      P      R      S      W      Y      l      m       p      r   	         €   
      
   ‚   	   ƒ      „      ‘   )         ¡      ¤      §      ·      Î      ×                         u˜  s˜             €íB    TíB 	   (íB 
   ìB    dìB    4ìB    ìB    äëB    ¬ëB    „ëB    LëB    ëB    ìêB    ÌêB    hêB     0êB !   8éB "   ˜èB x   „èB y   tèB z   dèB ü   `èB ÿ   PèB       x   
   ÿÿÿÿ€
                                                          ÿÿÿÿÿÿÿÿ                                                                                                                                                                                                                                                                                                                                                   abcdefghijklmnopqrstuvwxyz      ABCDEFGHIJKLMNOPQRSTUVWXYZ                                                                                                                                                                                                                                                                                                                                                                                                                                                       abcdefghijklmnopqrstuvwxyz      ABCDEFGHIJKLMNOPQRSTUVWXYZ                                                                                                                                     €C ¤  `‚y‚!       ¦ß      ¡¥      Ÿàü    @~€ü    ¨  Á£Ú£                        ş      @ş      µ  Á£Ú£                        ş      Aş      ¶  Ï¢ä¢ å¢è¢[                 ş      @~¡ş    Q  QÚ^Ú  _ÚjÚ2                 ÓØŞàù  1~ş    |ôB şÿÿÿC                                                                                              ¸…C             ¸…C             ¸…C             ¸…C             ¸…C                               ÀŒC         xòB  ÷B €øB  ŒC À…C    À…C €C ´çB     à¿C     à¿C                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ¤VB ¤VB ¤VB ¤VB ¤VB ¤VB ¤VB ¤VB ¤VB ¤VB ´çB ÈçB     .?AVbad_exception@std@@ ÈçB     .?AVexception@std@@                        €p     ğñÿÿ    PST                                                             PDT                                                             àŠC  ‹C ÿÿÿÿ        ÿÿÿÿ        ÿÿÿÿ   ;   Z   x   —   µ   Ô   ó     0  N  m  ÿÿÿÿ   :   Y   w   –   ´   Ó   ò     /  M  l          ¬ğB œğB xòB zôB ¨úB ¤úB  úB œúB ˜úB ”úB úB ˆúB €úB xúB lúB `úB XúB LúB HúB DúB @úB <úB 8úB 4úB 0úB ,úB (úB $úB  úB úB úB úB  úB øùB 8úB ğùB èùB àùB ÔùB ÌùB ÀùB ´ùB °ùB ¬ùB  ùB ŒùB €ùB 	          ŒC .   ¼ŒC p¾C p¾C p¾C p¾C p¾C p¾C p¾C p¾C p¾C ÀŒC    .      ´çB  “                              üÿÿ5      @   ÿ  €   ÿÿÿ             şÿÿÿşÿÿÿ              @         È@         ú@        @œ@        PÃ@        $ô@       €–˜@        ¼¾@     ¿É4@   ¡íÌÎÂÓN@ ğµp+¨­Åi@Ğ]ı%åOëƒ@q–×•C)¯@ù¿ Dí‚¹@¿<Õ¦ÏÿIxÂÓ@oÆàŒé€ÉGº“¨A¼…kU'9÷pà|B¼İŞùûë~ªQC¡ævãÌò)/„&D(ªø®ãÅÄúDë§Ôó÷ëáJz•ÏEeÌÇ‘¦® ã£Feu†uvÉHMXBä§“9;5¸²íSM§å]=Å];‹’Zÿ]¦ğ¡ ÀT¥Œ7aÑı‹Z‹Ø%]‰ùÛgª•øó'¿¢È]İ€nLÉ›— ŠR`Ä%u    ÍÌÍÌÌÌÌÌÌÌû?q=
×£p=
×£ø?Zd;ßO—nƒõ?ÃÓ,eâX·Ññ?Ğ#„GG¬Å§î?@¦¶il¯½7†ë?3=¼BzåÕ”¿Öç?ÂııÎa„wÌ«ä?/L[áMÄ¾”•æÉ?’ÄS;uDÍ¾š¯?Şgº”9E­±Ï”?$#Æâ¼º;1a‹z?aUYÁ~±S|»_?×î/¾’…ûD?$?¥é9¥'ê¨*?}¬¡ä¼d|FĞİU>c{Ì#Twƒÿ‘=‘ú:zc%C1À¬<!‰Ñ8‚G—¸ ı×;ÜˆX±èã†¦;Æ„EB¶™u7Û.:3qÒ#Û2îIZ9¦‡¾ÀWÚ¥‚¦¢µ2âh²§RŸDY·,%Iä-64OS®Îk%Y¤ÀŞÂ}ûèÆçˆZW‘<¿Pƒ"NKebıƒ¯”}ä-ŞŸÎÒÈİ¦Ø
       €D        € 0                                                                                                                                                                                                                     ÈçB     .?AVCObject@@   ÈçB     .?AV?$CArray@PAVExposedObject@@PAV1@@@  ÈçB     .?AUIActiveScriptSiteWindow@@   ÈçB     .?AUIUnknown@@  ÈçB     .?AUIActiveScriptSite@@ ÈçB     .?AVActiveScriptSite@@  ÈçB     .?AUIDispatch@@ ÈçB     .?AVCAppEventListener@@ ÈçB     .?AUIEnumVARIANT@@  ÈçB     .?AVXEnumVARIANT@CEnumVariant@@ ÈçB     .?AVCCmdTarget@@    ÈçB     .?AVCEnumVariant@@  ÈçB     .PAVCException@@    ÈçB     .?AVExposedObject@@ ÈçB     .?AVCOleDispatchDriver@@    ÈçB     .?AVScriptEngineFactory@@   ÈçB     .?AVCScriptUtils@@  ÈçB     .?AVCUnnamedArguments@@ ÈçB     .?AVCNamedArguments@@   ÈçB     .?AVCArguments@@    ÈçB     .?AVCTextStream@@   ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿëB ÊB                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 