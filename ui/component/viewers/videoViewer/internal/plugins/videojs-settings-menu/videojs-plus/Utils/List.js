class List {
  constructor(array, startIndex) {
    this.values = array.slice(0);
    this.index_ = startIndex || 0;
    this.loop_ = true;
  }

  index(value) {
    if (typeof value !== 'undefined') {
      this.index_ = Math.max(0, Math.min(value, this.values.length - 1));
    } else {
      return this.index_;
    }
  }

  loop(value) {
    if (typeof value !== 'undefined') {
      this.loop_ = !!value;
    } else {
      return this.loop_;
    }
  }

  calc(steps) {
    const newIndex = this.index_ + steps;
    const length = this.values.length;

    return this.loop_
      ? (length + newIndex) % length
      : Math.max(0, Math.min(newIndex, length - 1));
  }

  step(steps) {
    this.index_ = this.calc(steps);

    return this.values[this.index_];
  }

  current() {
    return this.values[this.index_];
  }

  next() {
    return this.step(1);
  }

  prev() {
    return this.step(-1);
  }

  ended() {
    return this.index_ === this.values.length - 1;
  }
}

export default List;
