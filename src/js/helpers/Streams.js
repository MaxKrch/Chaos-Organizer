export default class Streams {
	constructor() {
		this.streams = {};
	}

  saveStream(name, stream) {
    if(!name || !stream) {
      console.log(`Failed creating stream`);
      return;
    }

    this.streams[name] = {
      stream$: stream,
      subscriptions: new Set(),
    }
  }

	subscribeToStream(stream, subscriber) {
    try {
      const targetStream = this.streams[stream];

      const subscription = targetStream.stream$.subscribe({
        next: subscriber,
      });

      targetStream.subscriptions.add(subscription);
 
    } catch (err) {
      console.log(`Failed subscribe to stream: ${err}`);
    }
  }

  unSubscribeFromStream(stream, subscription) {
    try {
      const targetStream = this.streams[stream];

      subscription.unsubscribe();
      targetStream.subscriptions.delete(subscription);
    } catch (err) {
      console.log(`Failed unsubscribe from stream: ${err}`);
    }
  }

  clearSubscriptionsStream(stream) {
    try {
      const targetStream = this.streams[stream];

      targetStream.subscriptions.forEach((subscription) => {
        this.unSubscribeFromStream(stream, subscription);
      });

      this.streams[stream] = null;

    } catch (err) {
      console.log(`Failed clearning of stream: ${err}`);
    }
  }

  addDataToStream(stream, data) {
    try {
      const targetStream = this.streams[stream];
      targetStream.stream$.next(data);
    } catch (err) {
      console.log(`Failed add data to stream: ${err}`);
    }

  }
}