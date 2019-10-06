// 顶点着色器程序
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' + // attribute variable
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' + // Set the vertex coordinates of the point
  '  v_Color = a_Color;\n' +
  '}\n';

// 片元着色器程序
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
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
  }
}

var currentAngle = [0.0, 0.0]; // 绕X轴Y轴的旋转角度 ([x-axis, y-axis])
var curScale = 1.0;   //当前的缩放比例

function main() {
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

  // 设置顶点位置
  var cuboid = new Cuboid(399589.072, 400469.072, 3995118.062, 3997558.062, 732, 1268);
  var n = initVertexBuffers(gl, cuboid);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  //注册鼠标事件
  initEventHandlers(canvas);

  // 指定清空<canvas>的颜色
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // 开启深度测试
  gl.enable(gl.DEPTH_TEST);

  //绘制函数
  var tick = function () {
    //设置MVP矩阵
    setMVPMatrix(gl, canvas, cuboid);

    //清空颜色和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //绘制矩形体
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    //请求浏览器调用tick
    requestAnimationFrame(tick);  
  };

  //开始绘制
  tick();

  // 绘制矩形体
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

//注册鼠标事件
function initEventHandlers(canvas) {
  var dragging = false;         // Dragging or not
  var lastX = -1, lastY = -1;   // Last position of the mouse

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
function setMVPMatrix(gl, canvas, cuboid) {
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
  modelMatrix.translate(-cuboid.CenterX(), -cuboid.CenterY(), -cuboid.CenterZ());

  //投影矩阵
  var fovy = 60;
  var near = 1;
  var projMatrix = new Matrix4();
  projMatrix.setPerspective(fovy, canvas.width / canvas.height, 1, 10000);

  //计算lookAt()函数初始视点的高度
  var angle = fovy / 2 * Math.PI / 180.0;  
  var eyeHight = (cuboid.LengthY() * 1.2) / 2.0 / angle;

  //视图矩阵  
  var viewMatrix = new Matrix4();  // View matrix   
  viewMatrix.lookAt(0, 0, eyeHight, 0, 0, 0, 0, 1, 0);

  //MVP矩阵
  var mvpMatrix = new Matrix4();
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

  //将MVP矩阵传输到着色器的uniform变量u_MvpMatrix
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
}

//
function initVertexBuffers(gl, cuboid) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  // 顶点坐标和颜色
  var verticesColors = new Float32Array([
    cuboid.maxX, cuboid.maxY, cuboid.maxZ, 1.0, 1.0, 1.0,  // v0 White
    cuboid.minX, cuboid.maxY, cuboid.maxZ, 1.0, 0.0, 1.0,  // v1 Magenta
    cuboid.minX, cuboid.minY, cuboid.maxZ, 1.0, 0.0, 0.0,  // v2 Red
    cuboid.maxX, cuboid.minY, cuboid.maxZ, 1.0, 1.0, 0.0,  // v3 Yellow
    cuboid.maxX, cuboid.minY, cuboid.minZ, 0.0, 1.0, 0.0,  // v4 Green
    cuboid.maxX, cuboid.maxY, cuboid.minZ, 0.0, 1.0, 1.0,  // v5 Cyan
    cuboid.minX, cuboid.maxY, cuboid.minZ, 0.0, 0.0, 1.0,  // v6 Blue
    cuboid.minX, cuboid.minY, cuboid.minZ, 1.0, 0.0, 1.0   // v7 Black
  ]);

  //顶点索引
  var indices = new Uint8Array([
    0, 1, 2, 0, 2, 3,    // 前
    0, 3, 4, 0, 4, 5,    // 右
    0, 5, 6, 0, 6, 1,    // 上
    1, 6, 7, 1, 7, 2,    // 左
    7, 4, 3, 7, 3, 2,    // 下
    4, 7, 6, 4, 6, 5     // 后
  ]);

  //
  var FSIZE = verticesColors.BYTES_PER_ELEMENT;   //数组中每个元素的字节数

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
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);

  // 连接a_Position变量与分配给它的缓冲区对象
  gl.enableVertexAttribArray(a_Position);

  //获取着色器中attribute变量a_Color的地址 
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // 将缓冲区对象分配给a_Color变量
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  // 连接a_Color变量与分配给它的缓冲区对象
  gl.enableVertexAttribArray(a_Color);

  // 将顶点索引写入到缓冲区对象
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}