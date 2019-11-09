// 顶点着色器程序
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' + //位置
  'attribute vec4 a_Color;\n' + //颜色
  'attribute vec4 a_Normal;\n' + //法向量
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec4 v_Normal;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' + //设置顶点的坐标
  '  v_Color = a_Color;\n' +
  '  v_Normal = a_Normal;\n' +
  '}\n';

// 片元着色器程序
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec3 u_DiffuseLight;\n' + // 漫反射光颜色
  'uniform vec3 u_LightDirection;\n' + // 漫反射光的方向
  'uniform vec3 u_AmbientLight;\n' + // 环境光颜色
  'varying vec4 v_Color;\n' +
  'varying vec4 v_Normal;\n' +
  'void main() {\n' +
  //对法向量归一化
  '  vec3 normal = normalize(v_Normal.xyz);\n' +
  //计算光线向量与法向量的点积
  '  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
  //计算漫发射光的颜色 
  '  vec3 diffuse = u_DiffuseLight * v_Color.rgb * nDotL;\n' +
  //计算环境光的颜色
  '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
  '  gl_FragColor = vec4(diffuse+ambient, v_Color.a);\n' +
  '}\n';

//定义一个矩形体：混合构造函数原型模式
function Cuboid(minX, maxX, minY, maxY, minZ, maxZ) {
  this.minX = minX;
  this.maxX = maxX;
  this.minY = minY;
  this.maxY = maxY;
  this.minZ = minZ;
  this.maxZ = maxZ;
}

Cuboid.prototype = {
  constructor: Cuboid,
  CenterX: function () {
    return (this.minX + this.maxX) / 2.0;
  },
  CenterY: function () {
    return (this.minY + this.maxY) / 2.0;
  },
  CenterZ: function () {
    return (this.minZ + this.maxZ) / 2.0;
  },
  LengthX: function () {
    return (this.maxX - this.minX);
  },
  LengthY: function () {
    return (this.maxY - this.minY);
  },
  LengthZ: function () {
    return (this.maxZ - this.minZ);
  }
}

//定义一个球体
function Sphere(cuboid) {
  this.centerX = cuboid.CenterX();
  this.centerY = cuboid.CenterY();
  this.centerZ = cuboid.CenterZ();
  this.radius = Math.max(Math.max(cuboid.LengthX(), cuboid.LengthY()), cuboid.LengthZ()) / 2.0;
}

Sphere.prototype = {
  constructor: Sphere
}

//定义DEM
function Terrain() { }
Terrain.prototype = {
  constructor: Terrain,
  setWH: function (col, row) {
    this.col = col;
    this.row = row;
  }
}

var currentAngle = [0.0, 0.0]; // 绕X轴Y轴的旋转角度 ([x-axis, y-axis])
var curScale = 1.0; //当前的缩放比例

function main() {
  var demFile = document.getElementById('demFile');
  if (!demFile) {
    console.log("Failed to get demFile element!");
    return;
  }

  demFile.addEventListener("change", function (event) {
    //判断浏览器是否支持FileReader接口
    if (typeof FileReader == 'undefined') {
      console.log("你的浏览器不支持FileReader接口！");
      return;
    }

    var input = event.target;
    var reader = new FileReader();
    reader.onload = function () {
      if (reader.result) {

        //读取
        var terrain = new Terrain();
        if (!readDEMFile(reader.result, terrain)) {
          console.log("文件格式有误，不能读取该文件！");
        }

        //绘制
        onDraw(gl, canvas, terrain);
      }
    }

    reader.readAsText(input.files[0]);
  });

  // 获取 <canvas> 元素
  var canvas = document.getElementById('webgl');

  // 获取WebGL渲染上下文
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // 初始化着色器
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 指定清空<canvas>的颜色
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // 开启深度测试
  gl.enable(gl.DEPTH_TEST);

  //清空颜色和深度缓冲区
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

//绘制函数
function onDraw(gl, canvas, terrain) {
  // 设置顶点位置
  var n = initVertexBuffers(gl, terrain);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  //注册鼠标事件
  initEventHandlers(canvas);

  //设置灯光
  var lightDirection = setLight(gl);

  //绘制函数
  var tick = function () {
    //设置MVP矩阵
    setMVPMatrix(gl, canvas, terrain.sphere, lightDirection);

    //清空颜色和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //绘制矩形体
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);

    //请求浏览器调用tick
    requestAnimationFrame(tick);
  };

  //开始绘制
  tick();
}

//设置灯光
function setLight(gl) {
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  var u_DiffuseLight = gl.getUniformLocation(gl.program, 'u_DiffuseLight');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  if (!u_DiffuseLight || !u_LightDirection || !u_AmbientLight) {
    console.log('Failed to get the storage location');
    return;
  }

  //设置漫反射光
  gl.uniform3f(u_DiffuseLight, 1.0, 1.0, 1.0);

  // 设置光线方向(世界坐标系下的)
  var solarAltitude = 45.0;
  var solarAzimuth = 315.0;
  var fAltitude = solarAltitude * Math.PI / 180; //光源高度角
  var fAzimuth = solarAzimuth * Math.PI / 180; //光源方位角

  var arrayvectorX = Math.cos(fAltitude) * Math.cos(fAzimuth);
  var arrayvectorY = Math.cos(fAltitude) * Math.sin(fAzimuth);
  var arrayvectorZ = Math.sin(fAltitude);

  var lightDirection = new Vector3([arrayvectorX, arrayvectorY, arrayvectorZ]);
  lightDirection.normalize(); // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  //设置环境光
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

  return lightDirection;
}

//读取DEM函数
function readDEMFile(result, terrain) {
  var stringlines = result.split("\n");
  if (!stringlines || stringlines.length <= 0) {
    return false;
  }

  //读取头信息
  var subline = stringlines[0].split("\t");
  if (subline.length != 6) {
    return false;
  }
  var col = parseInt(subline[4]); //DEM宽
  var row = parseInt(subline[5]); //DEM高
  var verticeNum = col * row;
  if (verticeNum + 1 > stringlines.length) {
    return false;
  }
  terrain.setWH(col, row);

  //读取点信息
  var ci = 0;
  var pSize = 9;
  terrain.verticesColors = new Float32Array(verticeNum * pSize);
  for (var i = 1; i < stringlines.length; i++) {
    if (!stringlines[i]) {
      continue;
    }

    var subline = stringlines[i].split(',');
    if (subline.length != pSize) {
      continue;
    }

    for (var j = 0; j < pSize; j++) {
      terrain.verticesColors[ci] = parseFloat(subline[j]);
      ci++;
    }
  }

  if (ci !== verticeNum * pSize) {
    return false;
  }

  //包围盒
  var minX = terrain.verticesColors[0];
  var maxX = terrain.verticesColors[0];
  var minY = terrain.verticesColors[1];
  var maxY = terrain.verticesColors[1];
  var minZ = terrain.verticesColors[2];
  var maxZ = terrain.verticesColors[2];
  for (var i = 0; i < verticeNum; i++) {
    minX = Math.min(minX, terrain.verticesColors[i * pSize]);
    maxX = Math.max(maxX, terrain.verticesColors[i * pSize]);
    minY = Math.min(minY, terrain.verticesColors[i * pSize + 1]);
    maxY = Math.max(maxY, terrain.verticesColors[i * pSize + 1]);
    minZ = Math.min(minZ, terrain.verticesColors[i * pSize + 2]);
    maxZ = Math.max(maxZ, terrain.verticesColors[i * pSize + 2]);
  }

  terrain.cuboid = new Cuboid(minX, maxX, minY, maxY, minZ, maxZ);
  terrain.sphere = new Sphere(terrain.cuboid);

  return true;
}


//注册鼠标事件
function initEventHandlers(canvas) {
  var dragging = false; // Dragging or not
  var lastX = -1,
    lastY = -1; // Last position of the mouse

  //鼠标按下
  canvas.onmousedown = function (ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    // Start dragging if a moue is in <canvas>
    var rect = ev.target.getBoundingClientRect();
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
      lastX = x;
      lastY = y;
      dragging = true;
    }
  };

  //鼠标离开时
  canvas.onmouseleave = function (ev) {
    dragging = false;
  };

  //鼠标释放
  canvas.onmouseup = function (ev) {
    dragging = false;
  };

  //鼠标移动
  canvas.onmousemove = function (ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    if (dragging) {
      var factor = 100 / canvas.height; // The rotation ratio
      var dx = factor * (x - lastX);
      var dy = factor * (y - lastY);
      currentAngle[0] = currentAngle[0] + dy;
      currentAngle[1] = currentAngle[1] + dx;
    }
    lastX = x, lastY = y;
  };

  //鼠标缩放
  canvas.onmousewheel = function (event) {
    if (event.wheelDelta > 0) {
      curScale = curScale * 1.1;
    } else {
      curScale = curScale * 0.9;
    }
  };
}

//设置MVP矩阵
function setMVPMatrix(gl, canvas, sphere, lightDirection) {
  // Get the storage location of u_MvpMatrix
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) {
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }

  //模型矩阵
  var modelMatrix = new Matrix4();
  modelMatrix.scale(curScale, curScale, curScale);
  modelMatrix.rotate(currentAngle[0], 1.0, 0.0, 0.0); // Rotation around x-axis 
  modelMatrix.rotate(currentAngle[1], 0.0, 1.0, 0.0); // Rotation around y-axis 
  modelMatrix.translate(-sphere.centerX, -sphere.centerY, -sphere.centerZ);

  /*
  //----------------------透视---------------------
  //投影矩阵
  var fovy = 60;
  var projMatrix = new Matrix4();
  projMatrix.setPerspective(fovy, canvas.width / canvas.height, 1, 10000);

  //计算lookAt()函数初始视点的高度
  var angle = fovy / 2 * Math.PI / 180.0;
  var eyeHight = (sphere.radius * 2 * 1.1) / 2.0 / angle;

  //视图矩阵  
  var viewMatrix = new Matrix4(); // View matrix   
  viewMatrix.lookAt(0, 0, eyeHight, 0, 0, 0, 0, 1, 0);
  //----------------------透视---------------------
  */
  
  //----------------------正射---------------------
  //视图矩阵  
  var viewMatrix = new Matrix4();
  var r = sphere.radius + 10;
  viewMatrix.lookAt(lightDirection.elements[0] * r, lightDirection.elements[1] * r, lightDirection.elements[2] * r, 0, 0, 0, 0, 1, 0);

  //投影矩阵
  var projMatrix = new Matrix4();
  var diameter = sphere.radius * 2.1;
  var ratioWH = canvas.width / canvas.height;
  var nearHeight = diameter;
  var nearWidth = nearHeight * ratioWH;
  projMatrix.setOrtho(-nearWidth / 2, nearWidth / 2, -nearHeight / 2, nearHeight / 2, 1, 10000);
  //----------------------正射---------------------
 
  //MVP矩阵
  var mvpMatrix = new Matrix4();
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

  //将MVP矩阵传输到着色器的uniform变量u_MvpMatrix
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
}

//
function initVertexBuffers(gl, terrain) {
  //DEM的一个网格是由两个三角形组成的
  //      0------1            1
  //      |                   |
  //      |                   |
  //      col       col------col+1    
  var col = terrain.col;
  var row = terrain.row;

  var indices = new Uint16Array((row - 1) * (col - 1) * 6);
  var ci = 0;
  for (var yi = 0; yi < row - 1; yi++) {
    //for (var yi = 0; yi < 10; yi++) {
    for (var xi = 0; xi < col - 1; xi++) {
      indices[ci * 6] = yi * col + xi;
      indices[ci * 6 + 1] = (yi + 1) * col + xi;
      indices[ci * 6 + 2] = yi * col + xi + 1;
      indices[ci * 6 + 3] = (yi + 1) * col + xi;
      indices[ci * 6 + 4] = (yi + 1) * col + xi + 1;
      indices[ci * 6 + 5] = yi * col + xi + 1;
      ci++;
    }
  }

  //
  var verticesColors = terrain.verticesColors;
  var FSIZE = verticesColors.BYTES_PER_ELEMENT; //数组中每个元素的字节数

  // 创建缓冲区对象
  var vertexColorBuffer = gl.createBuffer();
  var indexBuffer = gl.createBuffer();
  if (!vertexColorBuffer || !indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // 将缓冲区对象绑定到目标
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  // 向缓冲区对象写入数据
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  //获取着色器中attribute变量a_Position的地址 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // 将缓冲区对象分配给a_Position变量
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 9, 0);

  // 连接a_Position变量与分配给它的缓冲区对象
  gl.enableVertexAttribArray(a_Position);

  //获取着色器中attribute变量a_Color的地址 
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // 将缓冲区对象分配给a_Color变量
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 9, FSIZE * 3);
  // 连接a_Color变量与分配给它的缓冲区对象
  gl.enableVertexAttribArray(a_Color);

  // 向缓冲区对象分配a_Normal变量,传入的这个变量要在着色器使用才行
  var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 9, FSIZE * 6);
  //开启a_Normal变量
  gl.enableVertexAttribArray(a_Normal);

  // 将顶点索引写入到缓冲区对象
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}