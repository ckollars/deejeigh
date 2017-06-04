const VolumeHandler = (() => {
  function VolumeHandler(initialStep) {
    if (initialStep == null) {
      initialStep = 3;
    }
    this.exec = require('child_process').exec;
    this.set(initialStep);
  }

  VolumeHandler.prototype.set = (step) => {
    step = this.validate_step(step);
    let vol = this.step_to_volume(step);
    this.exec('osascript -e "set Volume ' + step + '"', function(error, stdout, stderr) {});
    return this.current_step = step;
  };

  VolumeHandler.prototype.up = () => {
    return this.set(this.current_step + 1);
  };

  VolumeHandler.prototype.down = () => {
    return this.set(this.current_step - 1);
  };

  VolumeHandler.prototype.validate_step = (step) => {
    step = parseInt(step);
    if (isNaN(step)) {
      step = this.current_step;
    }
    if (step <= 0) {
      return 0;
    }
    if (step >= 10) {
      return 10;
    }
    return step;
  };

  VolumeHandler.prototype.step_to_volume = (step) => {
    if (step >= 10) {
      return 100;
    }
    if (step <= 0) {
      return 0;
    }
    return 80 + (2 * step);
  };

  return VolumeHandler;
})();

module.exports = function () {
  return new VolumeHandler(4);
};
