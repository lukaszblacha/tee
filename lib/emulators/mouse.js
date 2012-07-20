var mouseEmulator = new function() {
	this.pins = [];				// List of pins symbolizing touch places on the screen
	this.touches = [];			// List of currently active touches
	this.selectedTouch=null;	// Identifier of the current touch event
    this.touchStart = null;		// Startpoint of the lately changed touch
	this.touchId = 0;			// Latest triggered event identifier
	this.emulation=false;		// Multitouch emulation
	
    this.mouseIsDown = false;	// Indicates if mouse button is down
    this.mouseIsMoving = false;	// Indicates if mouse is moving and button is down

	// Pairs of event names:
	// native event --> emulated touch event
	this.eventMap = { "mouseup" : "touchend", "mousedown" : "touchstart", "mousemove" : "touchmove", "mouseout" : "touchcancel", "keyup" : "touchend" };

	/** 
	 * Helper function for copying special key statuses.
	 * Needed to be compatible with W3C standards
	 * */
	var copyEventKeys = function( source, destination ) {
		destination.ctrlKey	= source.ctrlKey;
		destination.altKey	= source.altKey;
		destination.shiftKey= source.shiftKey;
		destination.metaKey	= source.metaKey;
	}
	
	/**
	 * Function adds new touch to touch list and shows the visual indicator - 'pin'
	 * */
	this.addTouch = function(e) {
		var touch = new Touch(mouseEmulator.touchId++,e.target,e.clientX,e.clientY);
		var pin = document.createElement("span");
		pin.setAttribute("style","position:fixed;z-index:10000;width:12px;height:12px;border-radius:12px;border:solid 1px rgba(0,0,0,.2);box-shadow:0 0 3px #000;background:#ca7;top: "+(e.clientY-5)+"px;left:"+(e.clientX-5)+"px;");
		document.body.appendChild(pin);
		mouseEmulator.pins.push( pin );
		mouseEmulator.touches.push( touch );
		return touch;
	}
	
	/**
	 * Function removes the given touch from touch list and also removes the visual indicator
	 * */
	this.removeTouchAt = function( idx ) {
		// Remove changed touch from 'touches' array
		mouseEmulator.touches.splice( idx, 1 );
		var pin = mouseEmulator.pins.splice( idx, 1 )[0];
		document.body.removeChild( pin );
	}

	/** 
	 * Function removes all the touches from touch list and removes all the 'pins' from DOM structure
	 * */
	this.clearTouches = function() {
		while( mouseEmulator.pins.length>0 ) {
			var pin = mouseEmulator.pins.pop();
			pin.parentElement.removeChild( pin );
		}
		while( mouseEmulator.touches.length>0 ) {
			mouseEmulator.touches.pop();
		}
	}
	
	/**
	 * Returns the touches related to specified target
	 * */
	this.getTargetTouches = function(target) {
		var targetTouches = [];
		for( var i=0; i<mouseEmulator.touches.length; i++ ) {
			if( mouseEmulator.touches[i].target == target ) {
				targetTouches.push( mouseEmulator.touches[i] );
			}
		}
		return targetTouches;
	}
	
	/**
	 * Function enables multitouch emulation on holding [shift] key
	 * */
	this.enableMultitouch = function( e ) {
		if( e.keyCode!==16 ) return; // Non-shift keycode
		mouseEmulator.emulation = true;
	}
	
	/**
	 * Function disables multitouch emulation on releasing [shift] key
	 * */
	this.disableMultitouch = function( e ) {
		if( typeof e!=='undefined' && e.keyCode!==16 ) return; // Non-shift keycode
		document.removeEventListener( "mousemove", mouseEmulator.mousemoveHandler, false );
		mouseEmulator.emulation = false;
		mouseEmulator.mouseIsDown = false;
		mouseEmulator.mouseIsMoving = false;
		if( mouseEmulator.touches.length<=0 ) return;
		
		for( var t in mouseEmulator.touches ) {
			var touch = mouseEmulator.touches[t];
			var target = touch.target;
			touch.target = null;
			mouseEmulator.removeTouchAt( t );
			var touchEvent = document.createEvent("Event");
			// Dispatch non-cancelable event of type "touchcancel"
			touchEvent.initEvent( mouseEmulator.eventMap[e.type], true, false, 0 );
			touchEvent.targetTouches = mouseEmulator.getTargetTouches( touch.target );
			touchEvent.changedTouches = [ touch ];
			touchEvent.touches = mouseEmulator.touches;
			copyEventKeys( e, touchEvent );
			target.dispatchEvent( touchEvent );
		}
		e.preventDefault();
		e.stopPropagation();
		mouseEmulator.clearTouches();
		mouseEmulator.touchStart = null;
	}
	
	/**
	 * MouseDown event handler
	 * */
	this.mousedownHandler = function( e ) {
		mouseEmulator.mouseIsDown = true;
		var touchFound = false;
		// Check if one of the dot's is clicked
		if( mouseEmulator.emulation ) {
			for( var i in mouseEmulator.pins ) {
				if( Math.abs( mouseEmulator.touches[i].clientX-e.clientX )<=6 && Math.abs( mouseEmulator.touches[i].clientY-e.clientY )<=6 ) {
					mouseEmulator.selectedTouch = i;
					mouseEmulator.touchStart = mouseEmulator.touches[i];
					mouseEmulator.pins[i].style.background="#ca7";
					touchFound=true;
				}
			}
		}
		// Enable mousemove event
		document.addEventListener("mousemove",	mouseEmulator.mousemoveHandler, false);
		document.addEventListener("mouseup",	mouseEmulator.mouseupHandler, false);

		if( !touchFound ) {
			if(!mouseEmulator.emulation) mouseEmulator.clearTouches();
			mouseEmulator.touchStart = mouseEmulator.addTouch(e);
			mouseEmulator.selectedTouch = mouseEmulator.touches.length-1;
		} 
			var touchEvent = document.createEvent("Event");
			touchEvent.initEvent(mouseEmulator.eventMap[e.type], true, true, 0); //true true
			touchEvent.touches = mouseEmulator.touches;
			touchEvent.targetTouches = mouseEmulator.getTargetTouches(mouseEmulator.touchStart.target);
			touchEvent.changedTouches = [mouseEmulator.touchStart];
			copyEventKeys( e, touchEvent );
			e.target.dispatchEvent(touchEvent);
		
		e.preventDefault();
		e.stopPropagation();
	}

	/**
	 * MouseUp event handler
	 * */
	this.mouseupHandler = function(e) {
		if(!mouseEmulator.mouseIsDown) return;
		document.removeEventListener("mousemove", mouseEmulator.mousemoveHandler, false);
		document.removeEventListener("mouseup",	mouseEmulator.mouseupHandler, false);
		if(mouseEmulator.touches.length<=0) return;
		mouseEmulator.mouseIsDown = false;
		
		var newTarget = mouseEmulator.touches[mouseEmulator.selectedTouch].target;
		// NullTouch
		var nullTouch = new Touch( mouseEmulator.touches[mouseEmulator.selectedTouch].identifier, null, e.clientX, e.clientY );
		// Prepare touch event to dispatch
		var touchEvent = document.createEvent("Event");
		touchEvent.initEvent( mouseEmulator.eventMap[e.type], true, true, 0 );
		touchEvent.touches = mouseEmulator.touches;
		touchEvent.changedTouches = [ nullTouch ];
		copyEventKeys( e, touchEvent );		
		// Multitouch emulation actions
		if(mouseEmulator.emulation) {
			// If user simple clicked, add a pin to the touch. Do not dispatch touchend event
			if( !mouseEmulator.mouseIsMoving ) {
				mouseEmulator.pins[mouseEmulator.selectedTouch].style.background="#fff";
			// If user moved the mouse, remove the moved touch (the one with dark pin)
			} else {
				mouseEmulator.removeTouchAt( mouseEmulator.selectedTouch );
				touchEvent.targetTouches = mouseEmulator.getTargetTouches( newTarget );
				if( newTarget!=null ) newTarget.dispatchEvent( touchEvent );
				e.preventDefault();
				e.stopPropagation();
			}
		} else { // No multitouch emulation, remove all (1) touches from the list
			mouseEmulator.clearTouches();
			touchEvent.targetTouches = mouseEmulator.getTargetTouches(newTarget);
			if( newTarget!=null ) newTarget.dispatchEvent(touchEvent);
			e.preventDefault();
			e.stopPropagation();
		}
		mouseEmulator.touchStart=null;
		mouseEmulator.mouseIsMoving = false;
	}
	
	/**
	 * MouseOut event handler. Triggers TouchCancel event
	 * */
	this.mouseoutHandler = function(e) {
		if( !mouseEmulator.mouseIsDown ) return;
		if( e.relatedTarget != null ) return;
		document.removeEventListener( "mousemove", mouseEmulator.mousemoveHandler, false );
		
		mouseEmulator.mouseIsDown = false;
		mouseEmulator.mouseIsMoving = false;
		mouseEmulator.touchStart = null;
		
		var touch = new Touch( mouseEmulator.touches[mouseEmulator.selectedTouch].identifier, e.target, e.clientX, e.clientY );
		mouseEmulator.touches[mouseEmulator.selectedTouch] = touch;

		// Dispatch touchend event
		var touchEvent = document.createEvent("Event");
		touchEvent.initEvent( mouseEmulator.eventMap[e.type], true, true, 0 );
		touchEvent.changedTouches = [ touch ];
		touchEvent.targetTouches = mouseEmulator.getTargetTouches( touch.target );
		touchEvent.touches = mouseEmulator.touches;
		copyEventKeys( e, touchEvent );		
		if( mouseEmulator.emulation ) { // Remove last touch ( with no corresponding "pin" )
			mouseEmulator.removeTouchAt( mouseEmulator.selectedTouch );
		} else { // Remove all the pins
			mouseEmulator.touches = new Array();
		}

		e.target.dispatchEvent( touchEvent );
		e.preventDefault();
		e.stopPropagation();		
	}
	
	// Action to be preformed when the mouse moves
	this.mousemoveHandler = function(e) {
		if ( !mouseEmulator.mouseIsDown || mouseEmulator.touches.length==0 ) return;
		
		var newTarget = mouseEmulator.touches[mouseEmulator.selectedTouch].target;
		
		// Update visual indicator of touch being changed
		var pin = mouseEmulator.pins[mouseEmulator.selectedTouch];
		pin.style.left=e.clientX-6+"px";
		pin.style.top=e.clientY-6+"px";

		// Get the identifier of the selected touch object
		var id = mouseEmulator.touches[mouseEmulator.selectedTouch].identifier;
		// Create Touch object
		var touch = new Touch( id, newTarget, e.clientX, e.clientY );
		// Replace the active touch with newly created one
		mouseEmulator.touches[mouseEmulator.selectedTouch] = touch;

		if(!mouseEmulator.mouseIsMoving) {
			if( Math.abs(e.clientX-mouseEmulator.touchStart.clientX)>5 || 
				Math.abs(e.clientY-mouseEmulator.touchStart.clientY)>5 ) {
				mouseEmulator.mouseIsMoving = true;
			}
		}
		
		// Create and dispatch TouchMove event
		var touchEvent = document.createEvent("Event");
		touchEvent.initEvent(mouseEmulator.eventMap[e.type], true, true, 0);
		touchEvent.touches = mouseEmulator.touches;
		touchEvent.targetTouches = mouseEmulator.getTargetTouches(touch.target);
		touchEvent.changedTouches=[touch];
		copyEventKeys( e, touchEvent );
		newTarget.dispatchEvent(touchEvent);
		e.preventDefault();
		e.stopPropagation();
	}

//////////////////

	// Special things to do when mounting emulator
	this.mount = function() {
		document.addEventListener( "mouseout",	mouseEmulator.mouseoutHandler,	false );
		document.addEventListener( "keydown",	mouseEmulator.enableMultitouch,	false );
		document.addEventListener( "keyup",		mouseEmulator.disableMultitouch,false );
		document.addEventListener( "mousedown",	mouseEmulator.mousedownHandler,	false );
	}
	
	// Special things to do when unmounting emulator
	// Remove the mousemove and mouseup event in case the mouse button is down
	this.unmount = function() {
		mouseEmulator.disableMultitouch();
		document.removeEventListener( "mousedown",	mouseEmulator.mousedownHandler,	false );
		document.removeEventListener( "mousemove",	mouseEmulator.mousemoveHandler,	false );
		document.removeEventListener( "mouseup",	mouseEmulator.mouseupHandler,	false );
		document.removeEventListener( "mouseout", 	mouseEmulator.mouseoutHandler,	false );
		document.removeEventListener( "keydown", 	mouseEmulator.enableMultitouch,	false );
		document.removeEventListener( "keyup",		mouseEmulator.disableMultitouch,false );
	}

}