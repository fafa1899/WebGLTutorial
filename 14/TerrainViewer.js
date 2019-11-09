// 顶点着色器程序
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +  //位置
  'attribute vec4 a_Color;\n' + //颜色
  'attribute vec4 a_Normal;\n' + //法向量
  'uniform mat4 u_MvpMatrix;\n' +     //界面绘制操作的MVP矩阵
  'uniform mat4 u_MvpMatrixFromLight;\n' +      //光线方向的MVP矩阵
  'varying vec4 v_PositionFromLight;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec4 v_Normal;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_PositionFromLight = u_MvpMatrixFromLight * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '  v_Normal = a_Normal;\n' +
  '}\n';

// 片元着色器程序
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +  //阴影贴图
  'uniform vec3 u_DiffuseLight;\n' + // 漫反射光颜色
  'uniform vec3 u_LightDirection;\n' + // 漫反射光的方向
  'uniform vec3 u_AmbientLight;\n' + // 环境光颜色
  'varying vec4 v_Color;\n' +
  'varying vec4 v_Normal;\n' +
  'varying vec4 v_PositionFromLight;\n' +
  'float unpackDepth(const in vec4 rgbaDepth) {\n' +
  '  const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));\n' +
  '  float depth = dot(rgbaDepth, bitShift);\n' + // Use dot() since the calculations is same
  '  return depth;\n' +
  '}\n' +
  'void main() {\n' +
  //通过深度判断阴影
  '  vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;\n' +
  '  vec4 rgbaDepth = texture2D(u_Sampler, shadowCoord.xy);\n' +
  '  float depth = unpackDepth(rgbaDepth);\n' + // 将阴影贴图的RGBA解码成浮点型的深度值
  '  float visibility = (shadowCoord.z > depth + 0.0015) ? 0.7 : 1.0;\n' +
  //获得反射光
  '  vec3 normal = normalize(v_Normal.xyz);\n' +
  '  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +  //计算光线向量与法向量的点积  
  '  vec3 diffuse = u_DiffuseLight * v_Color.rgb * nDotL;\n' +  //计算漫发射光的颜色   
  '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +  //计算环境光的颜色
  //'  gl_FragColor = vec4(v_Color.rgb * visibility, v_Color.a);\n' +
  '  gl_FragColor = vec4((diffuse+ambient) * visibility, v_Color.a);\n' +
  '}\n';

// 顶点着色器程序-绘制到帧缓存
var FRAME_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +  //位置
  'attribute vec4 a_Color;\n' + //颜色
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' + // 设置顶点坐标
  '  v_Color = a_Color;\n' +
  '}\n';

// 片元着色器程序-绘制到帧缓存
var FRAME_FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);\n' +
  '  const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);\n' +
  '  vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);\n' + // Calculate the value stored into each byte
  '  rgbaDepth -= rgbaDepth.gbaa * bitMask;\n' + // Cut off the value which do not fit in 8 bits
  '  gl_FragColor = rgbaDepth;\n' +   //将深度保存在FBO中
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

// Size of off screen
var OFFSCREEN_WIDTH = 1024;
var OFFSCREEN_HEIGHT = 1024;

var currentAngle = [0.0, 0.0]; // 绕X轴Y轴的旋转角度 ([x-axis, y-axis])
var curScale = 1.0; //当前的缩放比例

function main() {
  // 获取 <canvas> 元素
  var canvas = document.getElementById('webgl');

  // 获取WebGL渲染上下文
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  //初始化两个着色器，drawProgram绘制到界面，frameProgram绘制到帧缓存
  var drawProgram = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  var frameProgram = createProgram(gl, FRAME_VSHADER_SOURCE, FRAME_FSHADER_SOURCE);
  if (!drawProgram || !frameProgram) {
    console.log('Failed to intialize shaders.');
    return;
  }

  //从着色器中获取地址，保存到对应的变量中
  GetProgramLocation(gl, drawProgram, frameProgram);

  // 初始化帧缓冲区对象 (FBO)
  var fbo = initFramebufferObject(gl);
  if (!fbo) {
    console.log('Failed to intialize the framebuffer object (FBO)');
    return;
  }

  // 开启深度测试
  gl.enable(gl.DEPTH_TEST);

  // 指定清空<canvas>的颜色
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  //清空颜色和深度缓冲区
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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

        //注册鼠标事件
        initEventHandlers(canvas);

        //绘制
        DrawDEM(gl, canvas, fbo, frameProgram, drawProgram, terrain);
      }
    }

    reader.readAsText(input.files[0]);
  });
}

//从着色器中获取地址，保存到对应的变量中
function GetProgramLocation(gl, drawProgram, frameProgram) {
  // Get the storage location of attribute variables and uniform variables 
  drawProgram.a_Position = gl.getAttribLocation(drawProgram, 'a_Position');
  drawProgram.a_Color = gl.getAttribLocation(drawProgram, 'a_Color');
  drawProgram.a_Normal = gl.getAttribLocation(drawProgram, 'a_Normal');
  drawProgram.u_MvpMatrix = gl.getUniformLocation(drawProgram, 'u_MvpMatrix');
  drawProgram.u_MvpMatrixFromLight = gl.getUniformLocation(drawProgram, 'u_MvpMatrixFromLight');
  if (drawProgram.a_Position < 0 || drawProgram.a_Color < 0 || drawProgram.a_Normal < 0 || !drawProgram.u_MvpMatrix
    || !drawProgram.u_MvpMatrixFromLight) {
    console.log('Failed to get the storage location of a_Position, a_Color, a_Normal, u_MvpMatrix, u_MvpMatrixFromLight');
    //return;
  }

  drawProgram.u_AmbientLight = gl.getUniformLocation(drawProgram, 'u_AmbientLight');
  drawProgram.u_DiffuseLight = gl.getUniformLocation(drawProgram, 'u_DiffuseLight');
  drawProgram.u_LightDirection = gl.getUniformLocation(drawProgram, 'u_LightDirection');
  if (!drawProgram.u_DiffuseLight || !drawProgram.u_LightDirection || !drawProgram.u_AmbientLight) {
    console.log('Failed to get the storage location of u_AmbientLight, u_DiffuseLight, u_LightDirection');
    //return;
  }

  frameProgram.a_Position = gl.getAttribLocation(frameProgram, 'a_Position');
  frameProgram.a_Color = gl.getAttribLocation(frameProgram, 'a_Color');
  frameProgram.u_MvpMatrix = gl.getUniformLocation(frameProgram, 'u_MvpMatrix');
  if (frameProgram.a_Position < 0 || frameProgram.a_TexCoord < 0 || !frameProgram.u_MvpMatrix) {
    console.log('Failed to get the storage location of a_Position, a_Color, u_MvpMatrix');
    //return;
  }
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
  terrain.vertices = new Float32Array(verticeNum * 3);
  terrain.colors = new Float32Array(verticeNum * 3);
  terrain.normals = new Float32Array(verticeNum * 3);
  for (var i = 1; i < stringlines.length; i++) {
    if (!stringlines[i]) {
      continue;
    }

    var subline = stringlines[i].split(',');
    if (subline.length != pSize) {
      continue;
    }

    for (var j = 0; j < 3; j++) {
      terrain.vertices[ci * 3 + j] = parseFloat(subline[j]);
    }


    for (var j = 0; j < 3; j++) {
      terrain.colors[ci * 3 + j] = parseFloat(subline[j + 3]);
    }

    for (var j = 0; j < 3; j++) {
      terrain.normals[ci * 3 + j] = parseFloat(subline[j + 6]);
    }

    ci++;
  }

  if (ci !== verticeNum) {
    return false;
  }

  //包围盒
  var minX = terrain.vertices[0];
  var maxX = terrain.vertices[0];
  var minY = terrain.vertices[1];
  var maxY = terrain.vertices[1];
  var minZ = terrain.vertices[2];
  var maxZ = terrain.vertices[2];
  for (var i = 0; i < verticeNum; i++) {
    minX = Math.min(minX, terrain.vertices[i * 3]);
    maxX = Math.max(maxX, terrain.vertices[i * 3]);
    minY = Math.min(minY, terrain.vertices[i * 3 + 1]);
    maxY = Math.max(maxY, terrain.vertices[i * 3 + 1]);
    minZ = Math.min(minZ, terrain.vertices[i * 3 + 2]);
    maxZ = Math.max(maxZ, terrain.vertices[i * 3 + 2]);
  }

  terrain.cuboid = new Cuboid(minX, maxX, minY, maxY, minZ, maxZ);
  terrain.sphere = new Sphere(terrain.cuboid);

  return true;
}

//绘制
function DrawDEM(gl, canvas, fbo, frameProgram, drawProgram, terrain) {
  // 设置顶点位置
  var demBufferObject = initVertexBuffersForDrawDEM(gl, terrain);
  if (!demBufferObject) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  //获取光线:平行光
  var lightDirection = getLight();

  //预先给着色器传递一些不变的量
  {
    //使用帧缓冲区着色器
    gl.useProgram(frameProgram);
    //设置在帧缓存中绘制的MVP矩阵
    var MvpMatrixFromLight = setFrameMVPMatrix(gl, terrain.sphere, lightDirection, frameProgram);

    //使用颜色缓冲区着色器
    gl.useProgram(drawProgram);
    //设置在颜色缓冲区中绘制时光线的MVP矩阵
    gl.uniformMatrix4fv(drawProgram.u_MvpMatrixFromLight, false, MvpMatrixFromLight.elements);
    //设置光线的强度和方向
    gl.uniform3f(drawProgram.u_DiffuseLight, 1.0, 1.0, 1.0);    //设置漫反射光
    gl.uniform3fv(drawProgram.u_LightDirection, lightDirection.elements);   // 设置光线方向(世界坐标系下的)  
    gl.uniform3f(drawProgram.u_AmbientLight, 0.2, 0.2, 0.2);    //设置环境光
    //将绘制在帧缓冲区的纹理传递给颜色缓冲区着色器的0号纹理单元
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
    gl.uniform1i(drawProgram.u_Sampler, 0);

    gl.useProgram(null);
  }

  //开始绘制
  var tick = function () {
    //帧缓存绘制
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); //将绘制目标切换为帧缓冲区对象FBO
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); // 为FBO设置一个视口

    gl.clearColor(0.2, 0.2, 0.4, 1.0); // Set clear color (the color is slightly changed)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear FBO
    gl.useProgram(frameProgram); //准备生成纹理贴图

    //分配缓冲区对象并开启连接
    initAttributeVariable(gl, frameProgram.a_Position, demBufferObject.vertexBuffer); // 顶点坐标
    initAttributeVariable(gl, frameProgram.a_Color, demBufferObject.colorBuffer); // 颜色

    //分配索引并绘制
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, demBufferObject.indexBuffer);
    gl.drawElements(gl.TRIANGLES, demBufferObject.numIndices, demBufferObject.indexBuffer.type, 0);

    //颜色缓存绘制
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); //将绘制目标切换为颜色缓冲区
    gl.viewport(0, 0, canvas.width, canvas.height); // 设置视口为当前画布的大小

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the color buffer
    gl.useProgram(drawProgram); // 准备进行绘制

    //设置MVP矩阵
    setMVPMatrix(gl, canvas, terrain.sphere, lightDirection, drawProgram);

    //分配缓冲区对象并开启连接
    initAttributeVariable(gl, drawProgram.a_Position, demBufferObject.vertexBuffer); // Vertex coordinates
    initAttributeVariable(gl, drawProgram.a_Color, demBufferObject.colorBuffer); // Texture coordinates
    initAttributeVariable(gl, drawProgram.a_Normal, demBufferObject.normalBuffer); // Texture coordinates

    //分配索引并绘制
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, demBufferObject.indexBuffer);
    gl.drawElements(gl.TRIANGLES, demBufferObject.numIndices, demBufferObject.indexBuffer.type, 0);

    window.requestAnimationFrame(tick, canvas);
  };
  tick();
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
function setMVPMatrix(gl, canvas, sphere, lightDirection, drawProgram) {
  //模型矩阵
  var modelMatrix = new Matrix4();
  modelMatrix.scale(curScale, curScale, curScale);
  modelMatrix.rotate(currentAngle[0], 1.0, 0.0, 0.0); // Rotation around x-axis 
  modelMatrix.rotate(currentAngle[1], 0.0, 1.0, 0.0); // Rotation around y-axis 
  modelMatrix.translate(-sphere.centerX, -sphere.centerY, -sphere.centerZ);

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

  /*
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
  projMatrix.setOrtho(-nearWidth / 2, nearWidth / 2, -nearHeight / 2, nearHeight / 2, 1, 10000);*/

  //MVP矩阵
  var mvpMatrix = new Matrix4();
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

  //将MVP矩阵传输到着色器的uniform变量u_MvpMatrix
  gl.uniformMatrix4fv(drawProgram.u_MvpMatrix, false, mvpMatrix.elements);
}

//设置MVP矩阵
function setFrameMVPMatrix(gl, sphere, lightDirection, frameProgram) {
  //模型矩阵
  var modelMatrix = new Matrix4();
  //modelMatrix.scale(curScale, curScale, curScale);
  //modelMatrix.rotate(currentAngle[0], 1.0, 0.0, 0.0); // Rotation around x-axis 
  //modelMatrix.rotate(currentAngle[1], 0.0, 1.0, 0.0); // Rotation around y-axis 
  modelMatrix.translate(-sphere.centerX, -sphere.centerY, -sphere.centerZ);

  //视图矩阵  
  var viewMatrix = new Matrix4();
  var r = sphere.radius + 10;
  viewMatrix.lookAt(lightDirection.elements[0] * r, lightDirection.elements[1] * r, lightDirection.elements[2] * r, 0, 0, 0, 0, 1, 0);
  //viewMatrix.lookAt(0, 0, r, 0, 0, 0, 0, 1, 0);

  //投影矩阵
  var projMatrix = new Matrix4();
  var diameter = sphere.radius * 2.1;
  var ratioWH = OFFSCREEN_WIDTH / OFFSCREEN_HEIGHT;
  var nearHeight = diameter;
  var nearWidth = nearHeight * ratioWH;
  projMatrix.setOrtho(-nearWidth / 2, nearWidth / 2, -nearHeight / 2, nearHeight / 2, 1, 10000);

  //MVP矩阵
  var mvpMatrix = new Matrix4();
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

  //将MVP矩阵传输到着色器的uniform变量u_MvpMatrix
  gl.uniformMatrix4fv(frameProgram.u_MvpMatrix, false, mvpMatrix.elements);

  return mvpMatrix;
}

//获取光线
function getLight() {
  // 设置光线方向(世界坐标系下的)
  var solarAltitude = 30.0;
  var solarAzimuth = 315.0;
  var fAltitude = solarAltitude * Math.PI / 180; //光源高度角
  var fAzimuth = solarAzimuth * Math.PI / 180; //光源方位角

  var arrayvectorX = Math.cos(fAltitude) * Math.cos(fAzimuth);
  var arrayvectorY = Math.cos(fAltitude) * Math.sin(fAzimuth);
  var arrayvectorZ = Math.sin(fAltitude);

  var lightDirection = new Vector3([arrayvectorX, arrayvectorY, arrayvectorZ]);
  lightDirection.normalize(); // Normalize  
  return lightDirection;
}

function initVertexBuffersForDrawDEM(gl, terrain) {
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

  var dem = new Object(); // Create the "Object" object to return multiple objects.

  // Write vertex information to buffer object
  dem.vertexBuffer = initArrayBufferForLaterUse(gl, terrain.vertices, 3, gl.FLOAT);
  dem.colorBuffer = initArrayBufferForLaterUse(gl, terrain.colors, 3, gl.FLOAT);
  dem.normalBuffer = initArrayBufferForLaterUse(gl, terrain.normals, 3, gl.FLOAT);
  dem.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_SHORT);
  if (!dem.vertexBuffer || !dem.colorBuffer || !dem.indexBuffer || !dem.normalBuffer) {
    return null;
  }

  dem.numIndices = indices.length;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return dem;
}

// 初始化帧缓冲区对象 (FBO)
function initFramebufferObject(gl) {
  var framebuffer, texture, depthBuffer;

  // Define the error handling function
  var error = function () {
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    if (texture) gl.deleteTexture(texture);
    if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
    return null;
  }

  // 创建帧缓冲区对象 (FBO)
  framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    console.log('Failed to create frame buffer object');
    return error();
  }

  // 创建纹理对象并设置其尺寸和参数
  texture = gl.createTexture(); // 创建纹理对象
  if (!texture) {
    console.log('Failed to create texture object');
    return error();
  }
  gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the object to target
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);  
  // 设置纹理参数
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  framebuffer.texture = texture; // 保存纹理对象

  // 创建渲染缓冲区对象并设置其尺寸和参数
  depthBuffer = gl.createRenderbuffer(); //创建渲染缓冲区
  if (!depthBuffer) {
    console.log('Failed to create renderbuffer object');
    return error();
  }
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

  // 将纹理和渲染缓冲区对象关联到帧缓冲区对象上
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);   //关联颜色
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);    //关联深度

  // 检查帧缓冲区是否被正确设置
  var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (gl.FRAMEBUFFER_COMPLETE !== e) {
    console.log('Frame buffer object is incomplete: ' + e.toString());
    return error();
  }

  // Unbind the buffer object
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  return framebuffer;
}

//分配缓冲区对象并开启连接
function initAttributeVariable(gl, a_attribute, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}

//向顶点缓冲区写入数据，留待以后分配
function initArrayBufferForLaterUse(gl, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Store the necessary information to assign the object to the attribute variable later
  buffer.num = num;
  buffer.type = type;

  return buffer;
}

//向顶点缓冲区写入索引，留待以后分配
function initElementArrayBufferForLaterUse(gl, data, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

  buffer.type = type;

  return buffer;
}