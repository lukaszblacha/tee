var holdHandler = new function() {
	this.timerID = null;
	this.startTouch = null;
	
	this.startHandler = function(e) {
		if(holdHandler.timerID==null) {
			holdHandler.startTouch=e.changedTouches[0];
			holdHandler.timerID = setTimeout("holdHandler.dispatchEvent(holdHandler.startTouch)",1000);
		}
	}

	this.dispatchEvent = function(e) {
		if(e!==null && holdHandler.timerID!==null) {
			var event = document.createEvent("MouseEvents");
			event.initMouseEvent("tmHold", 
				true, true, null, null, e.clientX, e.clientY, e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, 0, null );
			event.identifier = e.identifier;
			e.target.dispatchEvent(event);
		}
		holdHandler.endHandler(e);
	}
	
	this.endHandler = function(e) {
		if(holdHandler.startTouch!==null) {
			clearTimeout(holdHandler.timerID);
			holdHandler.timerID=null;
			holdHandler.startTouch=null;
		}
	}

	this.eventMap=new Array(
		{eventType:"touchstart",action:this.startHandler,useCapture:true,touchCount:[1]},
		{eventType:"touchmove",action:this.endHandler,useCapture:true,touchCount:[1]},
		{eventType:"touchcancel",action:this.endHandler,useCapture:true,touchCount:[0,2]},
		{eventType:"touchend",action:this.endHandler,useCapture:true,touchCount:[0]}
	);
	
}