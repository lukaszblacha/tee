var slideHandler = new function() {
	this.startTouches = {}

	this.touchstartHandler = function( e ) {
		var t0=e.targetTouches[0];
		slideHandler.startTouches[e.targetTouches[0].identifier] = new Touch(e.targetTouches[0].identifier,e.targetTouches[0].target,e.targetTouches[0].clientX,e.targetTouches[0].clientY);
		var event = document.createEvent("Event");
		event.initEvent( "tmSlideStart", true, true, 0 );
		event.touch = t0;
		event.identifier = t0.identifier;
		slideHandler.startTouches[e.targetTouches[0].identifier].target.dispatchEvent(event);
	}
	
	this.touchmoveHandler = function( e ) {
		for( i in e.changedTouches ) {
			var item = e.changedTouches[i];
			var t0 = slideHandler.startTouches[item.identifier];
			if( typeof t0=='undefined' ) return;

			var event = document.createEvent("Event");
			event.initEvent( "tmSlide", true, true, 0 );
			event.startTouch = t0;
			event.touch = item;
			event.dx = item.clientX-t0.clientX;
			event.dy = item.clientY-t0.clientY;
			event.distance = Math.sqrt( Math.pow(event.dx,2)+Math.pow(event.dy,2) );
			event.identifier = t0.identifier;
			t0.target.dispatchEvent( event );
		}
	}
	
	this.touchendHandler = function( e ) {
		for( i in e.changedTouches ) {
			var item = e.changedTouches[i];
			var t0 = slideHandler.startTouches[item.identifier];
			if( typeof t0=='undefined' ) continue;

			var event = document.createEvent("Event");
			event.initEvent( "tmSlideEnd", true, true, 0 );
			event.startTouch = t0;
			event.touch = item;
			event.dx = item.clientX-t0.clientX;
			event.dy = item.clientY-t0.clientY;
			event.distance = Math.sqrt( Math.pow(event.dx,2)+Math.pow(event.dy,2) );
			event.identifier = t0.identifier;
			t0.target.dispatchEvent( event );
			delete slideHandler.startTouches[item.identifier];
		}
	}
	
	this.eventMap=new Array(
		{eventType:"touchstart",action:this.touchstartHandler,useCapture:false,touchCount:[1]},
		{eventType:"touchmove",action:this.touchmoveHandler,useCapture:false,touchCount:[1]},
		{eventType:"touchend",action:this.touchendHandler,useCapture:false,touchCount:[0]},
		{eventType:"touchcancel",action:this.touchendHandler,useCapture:false,touchCount:[1]}
	);
}