this.FTKJ = this.FTKJ || {};
(function() {
	var Main = function(dom) {
		this.model = new FTKJ.Model({
			dom:dom
		});
	};

	var p = Main.prototype;

	p.init = function() {

	};

	p.render = function() {
		this.model.render();
	};

	FTKJ.Main = Main;
})();