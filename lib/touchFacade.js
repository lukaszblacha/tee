/*	
	// Checks which property from the given array is supported by current browser
	this.getsupportedprop = function(arr) {
		// Reference root element of document
		var root = document.documentElement;
		// Loop through possible properties
		for (var i=0;i<arr.length;i++){
			// If the property value is a string, return that string
			if (typeof root.style[arr[i]]=="string") return arr[i];
		}
	}
	// Name of the css field supported by the current browser to apply transformations
	//this.cssTransform = this.getsupportedprop(['transform', 'MozTransform', 'WebkitTransform', 'msTransform', 'OTransform']);
*/

if( !( 'push' in Array ) ) {
	/** IE9 fix: no Array.push method */
	Array.push = function() {
		var n = this.length>>>0;
		for(var i=0; i<arguments.length; i++) {
			this[n] = arguments[i];
			n = n+1>>>0;
		}
		this.length=n;
		return n;
	};
}
if( !( 'pop' in Array ) ) {
	/** IE9 fix: no Array.pop method */
	Array.pop = function() {
		var n=this.length>>>0, value;
		if( n ) {
			value=this[--n];
			delete this[n];
		}
		this.length=n;
		return value;
	};
}

//////////////////////////////////////////////////////////////////////////////////////////

if( typeof TouchList=='undefined' ) {
	/** Fix for browsers not supporting Touch events */
	function TouchList() {
		var TouchList = new Array();	
		/** [W3C,Safari] Returns idx-th element from the list */
		TouchList.item = function( idx ) {
			return this[idx];
		}
		/** [W3C-only] Rather do not use this methid */
		TouchList.identifiedTouch = function( id ) {
			console.log('Warning: Using W3C-only methid TouchList.identifiedTouch');
			for( var i=0; i<this.length; i++ ) {
				if( this[i].identifier == id )
					return this[i];
			}
			return null;
		}
		return TouchList;
	}
}

if(typeof Touch=='undefined')
	/** Fix for browsers not supporting Touch events */
	function Touch( id, target, x, y ) {
		this.identifier = id;
		this.target = target;
		this.clientX = x; this.pageX = x; this.screenX = x;
		this.pageY = y; this.clientY = y; this.screenY = y;
	}

////////////////////////////////////////////////////////////////////////////////

// Facade for events triggered by pointing devices
// - Emulator which converts non-touch pointing events to touch events
// - MultiTouch event dispatchers (touch handlers)
var touchFacade = new function() {

	// Registered multitouch emulator
	this.emulator = null;
	// Array containing event dispatchers depending on the number of touches
	this.touchCountMap = [];
	for( var i=0; i<20; i++ ) {
		this.touchCountMap.push( [] );
	}
	
	// Initialization. Binding all touch events to the manager
	this.init = function() {
		document.addEventListener( 'touchstart',  touchFacade.handler, false );
		document.addEventListener( 'touchmove',   touchFacade.handler, false );
		document.addEventListener( 'touchend',	  touchFacade.handler, false );
		document.addEventListener( 'touchcancel', touchFacade.handler, false );
	}
	
	// Registration of a particular multiutouch emulator
	this.registerEmulator = function( emulator ) {
		if( !touchFacade.isEmulator( emulator ) ) {
			throw "[Error] The argument is not a proper emulator object";
			return;
		}
		touchFacade.unregisterEmulator();
		touchFacade.emulator = emulator;
		// Do special magic things e.g. initialize emulator, add keyboard-related event listeners
		emulator.mount();
	}

	// Unregistering the multiutouch emulator
	this.unregisterEmulator = function() {
		if( touchFacade.emulator == null ) return;
		// Remove all event listeners added by emulator
		touchFacade.emulator.unmount();
		touchFacade.emulator = null;
	}


	
	// Registering particular multitouch event dispatcher
	this.registerDispatcher = function( d ) {
		if( !touchFacade.isDispatcher( d ) ) {
			throw '[Error] The given argument is not a proper dispatcher object';
			return;
		}
		for( var i=0;i<d.eventMap.length;i++ ) {
			var item = d.eventMap[i];
			for( var j=0; j<item.touchCount.length; j++ ) {
				touchFacade.touchCountMap[ item.touchCount[j] ].push( item );
			}
		}
	}
	
	// Unregistering the given multitouch event dispatcher
	this.unregisterDispatcher = function( d ) {
		var idx = touchFacade.handlers.indexOf( d );
		if( idx!=-1 ) {
			touchFacade.handlers.splice( idx, 1 );
			for( var i=0; i<d.eventMap.length; i++ ) {
				var item = d.eventMap[i];
				var idx1 = item.touchCountMap.indexOf(item);
				while( idx1>=0 ) {
					touchFacade.touchCountMap[idx1].splice( idx1, 1 );
					idx1 = item.touchCountMap.indexOf( item );
				}
			}
		} else {
			throw "[Error] There is no such registered event dispatcher";
		}
	}

	// Checking if the given argument is a proper emulator object
	this.isEmulator = function( emulator ) {
		if( typeof emulator.mount !== 'function' ) return false;
		if( typeof emulator.unmount !== 'function' ) return false;
		return true;
	}
	// Checking if the given argument is a proper multitouch event dispatcher
	this.isDispatcher = function( d ) {
		if( typeof d.eventMap === 'undefined' ) return false;
		return true;
	}

	// Main handler for all touch-related events
	this.handler = function( e ) {
		var touchCount = e.targetTouches.length;
		
		//TODO: touchend recognition on iPad -> touches from changedTouches without target
		//TODO: touchend recognition on Android -> touches from changedTouches with target --> how to tell which touch?
		
		var handlers = touchFacade.touchCountMap[ touchCount ];
		if( typeof handlers=='undefined' ) return;
		//TODO: trzeba asocjację po eventtype zrobić, a później dopiero liczbie (albo odwrotnie)
		for( var i=0; i<handlers.length; i++ ) {
			if( handlers[i].eventType == e.type ) handlers[i].action( e );
		}
		e.preventDefault();
	}
}