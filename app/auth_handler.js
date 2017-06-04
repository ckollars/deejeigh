const indexOf = [].indexOf || function (item) {
  for (let i = 0, l = this.length; i < l; i++) {
    if (i in this && this[i] === item) return i;
  }
  return -1;
};

const AuthHandler = (() => {
  function AuthHandler(authData) {
    this.authData = authData;
  }

  AuthHandler.prototype.validate = (request, response) => {
    let ref = null;
    let ref1 = null;
    let ref2 = null;
    this.command = null;
    this.user = null;
    this.args = [];
    if (!((((ref = request.body) != null ? ref.text : void 0) != null) && (((ref1 = request.body) != null ? ref1.token : void 0) != null))) {
      return false;
    }
    if (ref2 = request.body.token, indexOf.call(this.authData.tokens, ref2) >= 0) {
      this.user = request.body.user_id;
      this.user_name = request.body.user_name;
      const parts = request.body.text.split(' ');
      if (parts.length > 0) {
        this.command = parts.shift();
        while (parts.length > 0) {
          this.args.push(parts.shift());
        }
        return true;
      }
    }
    response.serveJSON(null, {
      httpStatusCode: 401,
    });
    return false;
  };

  return AuthHandler;

})();

module.exports = function (authData) {
  return new AuthHandler(authData);
};
