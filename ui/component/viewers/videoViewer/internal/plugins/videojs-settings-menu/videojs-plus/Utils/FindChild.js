import videojs from 'video.js';

function findChild(parent, name, result) {
  const children = [];

  if (parent && parent.childIndex_ && Object.keys(parent.childIndex_).length) {
    for (let componentId in parent.childIndex_) {
      const component = parent.childIndex_[componentId];

      if (component && component.name_ == name) {
        result.push({
          parent,
          component,
          index: parent.children_.indexOf(component),
          [name]: component
        });
      }

      children.push(findChild(component, name, result));
    }
  }

  return {
    name,
    parent,
    children
  };
}

videojs.getComponent('Component').prototype.findChild = function (name) {
  const result = [];

  findChild(this, name, result);

  return result;
};
