/* globals shaders */

/**
 * 所有线和粒子需要管理，包括出现，消失。
 * 线，如果存在则用原来的，不存在，则去创建。需要设置缓存。
 * 两点间线的连接方式，目前的是直线，曲线暂未设置。
 */
this.FTKJ = this.FTKJ || {};
(function() {
	function Model(json) {
		FTKJ.ThreeBase.call(this, json.dom);
		this.init();
	}

	var p = Model.prototype = Object.create(FTKJ.ThreeBase.prototype);
	Model.prototype.constructor = Model;

	p.init = function() {
		this.canOrbit = true;

		// 加载预定的资源，加载后的资源会放在this.resourcesMap里面，通过id访问 
		// 当资源加载完成后会自动调用initObject3D方法。
		var array = [
			// mtl 类型，会加载两个文件，url+.mtl 和 url+.obj
			{id: 'model', type: 'mtl', url: './obj/abc'},
			{id: 'spark', type: 'texture', url: './imgs/spark.png'},
			{id: 'smoke', type: 'texture', url: './imgs/smokeparticle.png'},
		];

		this.threeBaseInit(array);
		this.container = new THREE.Group();

		this.linkLineAry = []; // 保存所有实线的数组

		this.lineParticlesAry = [];	// 保存每个连线所有粒子的数组

		this.wireframeArr = []; // 保存线框对象的数组

		this.wireframeNames = ['??002','??003']; // 保存线框对象的名称，通过名称找对象；

		/** name 和 对象对照 
		 * ???02  area4 PLC 左  ID 789
		 * ???01  area4 PLC 右
		 * plc_1  area2 PLC
		 * ??01_1 area3 电脑 	ID 74
		 * ??_1	  area3 机箱前面圆柱体  ID 70 81
		 * PC_3   area3	机箱
		 * ??_1   id 653	
		 */
		
		this.plcJson = {
			ids:[789,788],
			pos:[
				[-1200,0,0],
				[-2400,0,0]
			]
		};

		// 电脑的id和位置
		this.mcJson = {
			ids: [74],
			pos: [
				[-430,0,0],
				[-860,0,0],

				[0,0,-430],
				[-430,0,-430],
				[-860,0,-430],

				[0,0,-860],
				[-430,0,-860],
				[-860,0,-860],

				[1620,0,-2516],
				[1620,0,-2984],
				[1620,0,-3448],
			]
		};
		// 机箱的id和位置
		this.caseJson = {
			ids:[81,70],
			pos:[
				[0,0,-252],
				[0,0,-252 - 94],
				[0,0,-252 - 94 - 134],
				[0,0,-252 - 94 - 134 - 252],
				[0,0,-252 - 94 - 134 - 252 - 94],
				[0,0,-252 - 94 - 134 - 252 - 94 - 150], 
				[0,0,-252 - 94 - 134 - 252 - 94 - 150 - 252], 
				[0,0,-252 - 94 - 134 - 252 - 94 - 150 - 252 - 94],
			]
		};

		var rY = 10; // 保证线显示在0平面上，在y轴上抬高的距离。

		this.clock = new THREE.Clock();

		this.lineData = {
			pointPos:{
				p1:[-620,rY,-400],
				p2:[-800,rY,-280],
				p3:[200,rY,-200],
				p4:[450,rY,-150],
				p5:[-450,rY,150],
				p6:[250,rY,-150],
				p7:[400,rY,50],
				p8:[-200,rY,-150],
				p9:[320,rY,-150],
				p10:[-320,rY,-100],
				p11:[600,rY,150],
				p12:[-500,rY,-450],
				p13:[350,rY,-150],
				p14:[-650,rY,150],
				p15:[-100,rY,100],
				p16:[100,rY,-100],
			},
			links:[
				// {start:'p1',end:'p2',lineColor:'#f00'},
				// {start:'p3',end:'p4',lineColor:'#0f0'},
				// {start:'p5',end:'p6',lineColor:'#0ff'},
				// {start:'p7',end:'p8',lineColor:'#ff0'},
				// {start:'p9',end:'p10',lineColor:'#fff'},
				// {start:'p11',end:'p12',lineColor:'#00f'},
				// {start:'p13',end:'p14',lineColor:'#f0f'},
				// {start:'p15',end:'p16',lineColor:'#f0f'},
			]
		};
	};

	/**
	 * 场景初始化完成，资源加载完成会自动调用的函数
	 */
	p.initObject3D = function() {
		this.camera.position.set(0, 1000, 1000);
		this.scene.add(this.container);
		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();
		// 模型加载后是完整的，形状材质都拥有，可直接放到场景中。如需模型中的单个建筑做处理，得找到该模型的name，再通过name比较来设置，问题：模型中的name不唯一。
		var modelObj = this.resourcesMap['model'].result;
		// 模型过大，设置一定的缩放比例
		modelObj.scale.x = modelObj.scale.y = modelObj.scale.z = 0.02;
		// 遍历模型对象，给对象设置相应的材质
		var wObj = new THREE.Object3D();
		wObj.scale.x = wObj.scale.y = wObj.scale.z = 0.02;

		var cloneObj = new THREE.Object3D();
		cloneObj.scale.x = cloneObj.scale.y = cloneObj.scale.z = 0.02;
		var _this = this;
		modelObj.traverse(function(child) {
			
			// _this.cloneObj(child,_this.plcJson,cloneObj);
			// _this.cloneObj(child,_this.mcJson,cloneObj);
			// _this.cloneObj(child,_this.caseJson,cloneObj);

			if (_this.findInArr(child.name,_this.wireframeNames)) {
				var box = new THREE.Box3().setFromObject(child);
				var mesh = child.clone();
				var material = new THREE.ShaderMaterial({
					uniforms:{
						t:{value:0},
						yMax:{value:box.max.y},
						aColor:{value:new THREE.Color(0xff0000)}
					},
					vertexShader: shaders.wireframeShader.vertexShader,
					fragmentShader: shaders.wireframeShader.fragmentShader,
					// transparent: true,
				});
				mesh.material = material;
				mesh.userData['vT'] = 0;// 初始不运动
				wObj.add(mesh);
				_this.wireframeArr.push(mesh);
			}
		});
		this.container.add(wObj);
		this.container.add(cloneObj);
		this.container.add(modelObj);
		this.modelObj = modelObj;

		this.graphicHelper();

		this.initLight();

		// this.initParticleMaterial();

		// this.initLine();

		// this.initLineParticles();
	};

	p.initLine = function() {
		var posJson = this.lineData.pointPos;
		var linksData = this.lineData.links;
		for (var i = 0; i < linksData.length; i++) {
			var item = linksData[i];
			var points = this.getPoints(posJson[item.start],posJson[item.end]);
			var color = new THREE.Color(item.lineColor);
			var lineObj  = new FTKJ.Line({
				points:points,
				linewidth:2,
				color:color
			});
			var line = lineObj.getLineMesh();
			this.container.add(line);
			this.linkLineAry.push(line);
		}
	};

	// 辅助图形，正式效果时不显示
	p.graphicHelper = function() {
		var axisHelper = new THREE.AxesHelper(400);
		this.container.add(axisHelper);
		
	};

	p.initLight = function() {
		var ambient = new THREE.AmbientLight(0x333333);
		this.container.add(ambient);
		var h = 300;
		var d = 200;
		var distance = 300;

		var light2 = new THREE.PointLight(0xffff33,0.70,distance);
		light2.position.set(0, h, 0);
		this.container.add(light2);

		var light3 = new THREE.PointLight(0xedf4f5,0.33,distance);
		light3.position.set(d*2, h, 0);
		this.container.add(light3);
		// 
		var light4 = new THREE.PointLight(0xedf4f5,0.36,distance);
		light4.position.set(-d*2, h, 0);
		this.container.add(light4);
		// 
		var light5 = new THREE.PointLight(0xedf4f5,0.34,distance);
		light5.position.set(0, h, d);
		this.container.add(light5);
		// 
		var light6 = new THREE.PointLight(0xedf4f5,0.36,distance);
		light6.position.set(0, h, -d);
		this.container.add(light6);
	};

	/*---------------------------------------------- 3d连线上的粒子 -------------------------------------*/
	p.initLineParticles = function() {
		var ary = this.linkLineAry;
		for (var i = 0; i < ary.length; i++) {
			var item = this.createLineParticlesItem(ary[i]);
			this.container.add(item);
			item.userData['cirV'] = 0.015;  // 初始化速度为0
			item.userData['opacity'] = 0.5;	// 初始化透明度为0
			item.userData['stop'] = false;
			this.lineParticlesAry.push(item);
		}
	};

	p.initParticleMaterial = function() {
		var texture = this.resourcesMap['spark'].result;
		this.particleMaterial = new THREE.ShaderMaterial({
			uniforms: {
				// color: {type: 'c', value: new THREE.Color(0xffffff)},
                opacity: {type: 'f', value: 1}, // 最大的透明度
                texture: {type: 't', value: texture},
			},
			vertexShader: shaders.pointShader.vertexShader,
			fragmentShader: shaders.pointShader.fragmentShader,
			transparent: true,
			depthTest:false
		});
	};

	/**
	 * 创建有宽度的线
	 * @param  {[array]} points    [画出线的点数组，vector3]
	 * @param  {[number]} lineWidth [线宽]
	 * @param  {[color]} color     [线的颜色]
	 * @return {[line]}           [画出的线]
	 */
	p.createLine = function(points,lineWidth,color) {
		
		return line;
	};

	/**
	 * 粒子运动
	 * 初始化创建粒子，大小颜色，透明度确定，位置在后续计算通过改变位置来运动
	 */
	p.createLineParticlesItem = function(line) {
		var curve = line.userData['curve'];
		var lineColor = line.userData['lineColor'];
		// var particleNum = Math.ceil(curve.getLength());
		var particleNum = 100;
        var positionAry = new Float32Array(particleNum * 3);
        var colorAry = new Float32Array(particleNum * 3);
        var lineColorAry = new Float32Array(particleNum * 3);
        var opacityAry = new Float32Array(particleNum);
        var sizeAry = new Float32Array(particleNum);
        var color = new THREE.Color(0xFFFFFF); // 更改粒子的颜色
        var perAry = new Float32Array(particleNum);
        var i = particleNum;
        var i3 = i*3;
        var range = 0.2; // 粒子覆盖的范围，占总长的百分比
        var sizeBase = 200;	// 粒子大小的计算基数。
        while(i3>0) {
        	i--;
            i3 -= 3;
            //
            var t = range*(i / particleNum);
            opacityAry[i] = 0;
            sizeAry[i] = sizeBase * window.devicePixelRatio * t;
            color.toArray(colorAry, i * 3);
            lineColor.toArray(lineColorAry, i * 3);
            //
            var v = curve.getPoint(t);
            perAry[i] = t;  // 保存每个点的t的值
            positionAry[i3] = v.x;
            positionAry[i3 + 1] = v.y;
            positionAry[i3 + 2] = v.z;
        }

        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.BufferAttribute(positionAry, 3));
        geometry.addAttribute('aColor', new THREE.BufferAttribute(colorAry, 3));
        geometry.addAttribute('lColor', new THREE.BufferAttribute(lineColorAry, 3));
        geometry.addAttribute('aOpacity', new THREE.BufferAttribute(opacityAry, 1));
        geometry.addAttribute('size', new THREE.BufferAttribute(sizeAry, 1));
        geometry.addAttribute('per', new THREE.BufferAttribute(perAry, 1));
        geometry.addAttribute('perOld', new THREE.BufferAttribute(perAry.slice(0), 1));
        //
        var particles = new THREE.Points(geometry, this.particleMaterial);
        geometry.attributes.position.needsUpdate = true;
        particles.userData['curve'] = curve;
        return particles;
	};

	p.lineParticlesRender = function () {
        if (this.lineParticlesAry) {
            var ary = this.lineParticlesAry;
            for (var i = 0; i < ary.length; i++) {
                this.lineParticlesItemRender(ary[i]);
            }
        }
    };

    p.wireframeRender = function() {
    	var type = 'downToUp';  // back ， downToUp
    	for (var i = 0; i < this.wireframeArr.length; i++) {
    		var item = this.wireframeArr[i];
    		var cT = item.userData['cT']; // 移动速度
    		var dirDown = item.userData['dirDown'];
    		var tValue = item.material.uniforms.t.value;
    		if (type == 'downToUp') { // 从下到上循环
    			item.material.uniforms.t.value += cT;
    			if (tValue >= 1.5) {
	    			item.material.uniforms.t.value = -0.5;
	    		}
    		}else if(type == 'back'){  // 上下往返循环
    			if (!dirDown) {
    				item.material.uniforms.t.value += cT;
    				if (tValue >= 1) {
    					item.userData['dirDown'] = true;
    				}
    			}else{
    				item.material.uniforms.t.value -= cT;
    				if (tValue <= 0) {
    					item.userData['dirDown'] = false;
    				}
    			}
    		}
    	}
    };

    p.lineParticlesItemRender = function (lineParticlesItem) {
        var curve = lineParticlesItem.userData['curve'];
        var cirV = lineParticlesItem.userData['cirV'];

        var positionAry = lineParticlesItem.geometry.attributes.position.array;
        var opacityAry = lineParticlesItem.geometry.attributes.aOpacity.array;
        var perAry = lineParticlesItem.geometry.attributes.per.array;
        var particleNum = opacityAry.length;
        var i = particleNum;
        var i3 = i * 3;
        while (i3 > 0) {
            i--;
            i3 -= 3;
            //
            perAry[i] += cirV;
            perAry[i] %= 1;
            var t = perAry[i];
            var v = curve.getPoint(t);
            //
            opacityAry[i] = lineParticlesItem.userData['opacity'] * t;

            positionAry[i3] = v.x;
            positionAry[i3 + 1] = v.y;
            positionAry[i3 + 2] = v.z;
        }
        lineParticlesItem.geometry.attributes.position.needsUpdate = true;
        lineParticlesItem.geometry.attributes.aOpacity.needsUpdate = true;
    };

    p.change = function() {
    	for (var i = 0; i < this.lineParticlesAry.length; i++) {
    		var item = this.lineParticlesAry[i];
    		var v = item.userData['cirV'];
    		var perOld = item.geometry.attributes.perOld.array.slice(0);
    		if (v == 0) {
    			item.userData['cirV'] = 0.015;
    			item.userData['opacity'] = 0.5;
    			item.geometry.attributes.per.array = perOld; // 粒子回到初始位置。
    		}else{
    			item.userData['cirV'] = 0;	// 粒子取消运动 运动速度为0
    			item.userData['opacity'] = 0;	// 粒子不可见
    		}
    	}
    };

    p.windowClick = function(ev) {
    	this.mouse.x = ev.clientX/window.innerWidth * 2 - 1;
    	this.mouse.y = -ev.clientY/window.innerHeight * 2 + 1;
    	if (this.raycaster) {
			this.raycaster.setFromCamera(this.mouse,this.camera);
			var intersects = this.raycaster.intersectObjects(this.modelObj.children);
			if (intersects.length) {
				var clickObj = intersects[0].object;
	    		// for (var i = 0; i < this.wireframeArr.length; i++) {
		    	// 	var item = this.wireframeArr[i];
		    	// 	if (item.name == clickObj.name) {
		    	// 		item.userData['cT'] = 0.02;
		    	// 		item.material.uniforms.t.value = 0;
		    	// 		item.material.uniforms.aColor.value = new THREE.Color(0xffffff * Math.random());
		    	// 	}
		    	// }
		    	// clickObj.visible = false;
		    	// console.log(clickObj);
			}
		}
    };

	// 渲染时会一直调用的函数
	p.renderFun = function() {
		this.lineParticlesRender(); // 粒子运动渲染
		this.wireframeRender(); // 建筑外线框运动渲染
	};

	p.cloneObj = function(child,json,parent) {

		if (this.findInArr(child.id,json.ids)) {
			for (var i = 0; i < json.pos.length; i++) {
				let item = json.pos[i];
				let newChild = child.clone();
				newChild.position.set(item[0],item[1],item[2]);
				parent.add(newChild);
			}
		}
	};

	/**
	 * [根据两点，计算中间点，返回三个点的坐标,暂定中间的坐标为先改y轴的值，再改x轴的值]
	 * @param  {[array]} p1 [x,y,z]
	 * @param  {[array]} p2 [x,y,z]
	 * @return {[array]}    [vec3,vec3,vec3]
	 */
	p.getPoints = function(p1,p2) {
		var x1 = p1[0];
		var z1 = p1[2];
		var y = p1[1];
		var x2 = p2[0];
		var z2 = p2[2];
		var points = [new THREE.Vector3( x1, y, z1 )];
		if (x1 !== x2 && z1 !== z2) {
			points.push(new THREE.Vector3( x1, y, z2 ));
		}
		points.push(new THREE.Vector3( x2, y, z2 ));
		return points;
	};

	// 数组里是否有某项
	p.findInArr = function(n,arr) {
		if (!arr || !arr.length) {
			return false;
		}else{
			for (var i = 0; i < arr.length; i++) {
				if (n === arr[i]) {
					return true;
				}
			}
			return false;
		}
	};

	FTKJ.Model = Model;
})();