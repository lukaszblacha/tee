var tapHandler = new function() {
	this.timerID = null;
	this.startTouch = null;
	
	this.startHandler = function(e) {
		if(tapHandler.timerID==null) {
			tapHandler.startTouch=e.changedTouches[0];
			tapHandler.timerID = setTimeout("tapHandler.cancelHandler(null)",1000);
		}
	}

	this.dispatchEvent = function(e) {
		if(e!==null && tapHandler.timerID!==null) {
			var event = document.createEvent("MouseEvents");
			event.initMouseEvent("tmTap", 
				true, true, null, null, e.clientX, e.clientY, e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, 0, null );
			event.identifier = e.identifier;
			e.target.dispatchEvent(event);
		}
		tapHandler.cancelHandler(e);
	}
	
	this.endHandler = function(e) {
		if(tapHandler.startTouch!==null) {
			tapHandler.dispatchEvent(e);
		}
	}
	
	this.cancelHandler = function(e) {
		clearTimeout(tapHandler.timerID);
		tapHandler.timerID=null;
		tapHandler.startTouch=null;
	}

	this.eventMap=new Array(
		{eventType:"touchstart",action:this.startHandler,useCapture:true,touchCount:[1]},
		{eventType:"touchmove",action:this.cancelHandler,useCapture:true,touchCount:[1]},
		{eventType:"touchcancel",action:this.cancelHandler,useCapture:true,touchCount:[1]},
		{eventType:"touchend",action:this.endHandler,useCapture:true,touchCount:[0]}
	);

}