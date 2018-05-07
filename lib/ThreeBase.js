/**
 * Threejs模板,包括资源加载及最基础的3d场景创建
 */

this.FTKJ = this.FTKJ || {};

(function (){
    var ThreeBase = function(dom){
        this.dom = dom;
    };

    var p = ThreeBase.prototype;
    ThreeBase.prototype.constructor = ThreeBase;

    //是否可以拖动查看3D场景,方便调试.上线之前请将其关闭.
    p.canOrbit = true;
    //

    //有资源需要加载时,先加载资源,之后初始化3D场景;无资源加载时,直接初始化3D场景.
    p.threeBaseInit = function(ary){
        if(ary){
            this.initLoader(ary);
        }else{
            this.init3d();
        }
    };

    //---------------------------------------- resources part---- ----------------------------------------//
    //p.resourcesMap ={};


    /*ary 为资源列表,结构如下:
        [
            {id:"key值", type:"texture", url:"资源url"},
            {id:"key值", type:"image", url:"资源url"}
        ]
    */
    p.initLoader = function(ary)
    {
        var cur = this;
        this.loader = new FTKJ.ThreeGroupLoader();
        this.loader.$eventDispatcher.bind('loadProgress',function(e,data){
            //console.log(data);
        });
        this.loader.$eventDispatcher.bind('loadComplete',function(e,data){
            console.log("loadComplete");
            cur.resourcesMap = data;
            cur.init3d();
        });
        this.loader.load(ary);
    };


    //--------------------------------------------- 3D part-----------------------------------------------//
    p.init3d=function() {
        this.initRender();
        this.initCamera();
        this.initScene();
        this.initLight();
        this.reset3D();
        this.initResize();
        //
        this.initObject3D();
    };

    p.initRender=function(dom) {
        this.renderer = new THREE.WebGLRenderer({ antialias: true ,alpha:true});
        this.render.autoClear = false;
        //console.log(this.renderer.setClearColor());
        // this.renderer.autoClear = true;
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.dom.appendChild( this.renderer.domElement );
    };

    p.initCamera=function() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        this.camera = new THREE.PerspectiveCamera( 45, width / height, 1, 3000   );  // 渲染距离尽量不要超过5000；
        this.camera.position.set(0, 0, 1000);
        // this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        if(this.canOrbit){
            this.controls = new THREE.OrbitControls( this.camera );
        }
    };

    p.initScene = function() {
        this.scene = new THREE.Scene();
        // this.scene.fog = new THREE.Fog( 0x1d2157, 0, 9000 );
    };

    p.initLight = function(){

    };

    //根据具体情况，重新设定camera,scene,renderer的相关属性
    p.reset3D = function(){

    };

    p.render = function() {
        if(this.renderer)
        {
            this.renderer.render( this.scene, this.camera );
            if(this.canOrbit){
                this.controls.update();
            }
            this.renderFun();
        }
    };

    p.renderFun = function(){

    };

    p.initResize = function() {
        var cur = this;
        window.addEventListener( 'resize', function(){
            cur.resizeFun();
        }, false );
        this.resizeFun();
    };

    p.resizeFun = function() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        //
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( width, height );
    };

    p.initObject3D = function(){

    };


    FTKJ.ThreeBase = ThreeBase;

})();