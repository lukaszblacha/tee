var pinchHandler = new function() {
	this.target = {};
	this.startTouches = {};

	this.initEvent = function(newType,baseEvent) {
		var event = document.createEvent("Event");
		event.initEvent(newType, true, true, 0);
		event.ctrlKey=baseEvent.ctrlKey;
		event.altKey=baseEvent.altKey;
		event.shiftKey=baseEvent.shiftKey;
		event.metaKey=baseEvent.metaKey;
		if( typeof arguments[2]!=='undefined' ) {
			event.targetTouches=arguments[2];
		} else event.targetTouches = baseEvent.targetTouches;
		return event;
	}
	
	this.touchstartHandler = function(e) {
		var eid = e.targetTouches[0].identifier;
		pinchHandler.target[eid] = e.targetTouches[0].target;
		pinchHandler.startTouches[eid] = e.targetTouches;
		var event = pinchHandler.initEvent("tmPinchStart",e);
		pinchHandler.target[eid].dispatchEvent(event);
	}

	this.touchmoveHandler = function( e ) {
		var touches = {};
		for( i in e.changedTouches ) {
			var item = e.changedTouches[i];
			// Ten element ju¿ jest przetworzony
			if( touches.hasOwnProperty(item.identifier) ) continue;
			touches[item.identifier]=[];
			for( var j in e.touches )
				if( e.touches[j].target===item.target )
					touches[item.identifier].push( e.touches[j] );
			if( touches[item.identifier].length!==2 ) continue;
			
			var eid = null;
			for( var j in touches[item.identifier] )
				if( typeof pinchHandler.startTouches[touches[item.identifier][j].identifier] !== 'undefined' ) {
					eid=touches[item.identifier][j].identifier;
					continue;
				}
			if( eid==null ) continue;
			
			var tt = touches[item.identifier];
			var ts = pinchHandler.startTouches[eid];
			var event = pinchHandler.initEvent("tmPinch",e, tt);
			
			// Compute scale and rotation if needed
			var x1 = ts[0].clientX-ts[1].clientX,
				y1 = ts[0].clientY-ts[1].clientY,
				x2 = tt[0].clientX - tt[1].clientX,
				y2 = tt[0].clientY - tt[1].clientY;
			e.rotation = (Math.atan(x1 / y1) - Math.atan(x2 / y2)) * 57.29578; //180/PI
			if ((y1 >= 0 && y2 < 0) || (y1 < 0 && y2 >= 0)) e.rotation += 180;
			e.scale = Math.sqrt(x2 * x2 + y2 * y2) / Math.sqrt(x1 * x1 + y1 * y1);
			event.rotation=e.rotation;
			event.scale=e.scale;
			item.target.dispatchEvent(event);
		}
		delete touches;
	}
	
	this.touchendHandler = function( e ) {
		for( var i in e.changedTouches ) {
			var item = e.changedTouches[i];
			var ts = pinchHandler.startTouches[item.identifier];
			if(typeof ts=='undefined') continue;
			var event = pinchHandler.initEvent("tmPinchEnd",e);
			ts[0].target.dispatchEvent(event);
			delete pinchHandler.target[item.identifier];
			delete pinchHandler.startTouches[item.identifier];
		}
	}
	
	this.eventMap=new Array(
		{eventType:"touchstart",action:this.touchstartHandler,useCapture:false,touchCount:[2]},
		{eventType:"touchmove",action:this.touchmoveHandler,useCapture:false,touchCount:[2]},
		{eventType:"touchend",action:this.touchendHandler,useCapture:false,touchCount:[1]},
		{eventType:"touchcancel",action:this.touchendHandler,useCapture:false,touchCount:[2]}
	);

}