# 1. 绪论
最近研究WebGL，看了《WebGL编程指南》这本书，结合自己的专业知识写的一系列教程。之前在看OpenGL/WebGL的时候总是感觉OpenGL/WebGL看的时候懂，实际用起来却挺难，感觉中间总是隔着很多东西。现在一路边学边写，才明白这中间缺少的其实就是总结，是实践；把这个过程写出来，既是帮助他人，也是帮助自己。

现在这一系列文章也写了不少了，就写个目录汇总一下，方便查阅，以后增添了新的文章也会随之更新。这一系列教程由浅入深，知识也是循序渐进的，前后关联。实例也逐渐复杂，最终完成一个地形渲染的实例：<div align=center> ![image][imglink1]<div>图1：地形渲染(纹理)</div></div><br><div align=center> ![image][imglink2]<div>图2：地形渲染(颜色)</div></div>

# 2. 目录

1.[WebGL简易教程(一)：第一个简单示例][netlink1]

概述了这篇教程的目的，编写了WebGL的第一个示例。

2.[WebGL简易教程(二)：向着色器传输数据][netlink2]

改进了绘制一个点的实例，讲述了WebGL中向着色器(shader)传输数据的问题。

3.[WebGL简易教程(三)：绘制一个三角形(缓冲区对象)][netlink3]

通过一个绘制三角形的具体实例，详解了WebGL中缓冲区对象(buffer object)的使用。

4.[WebGL简易教程(四)：颜色][netlink4]

通过绘制彩色三角形的示例，介绍了varying变量，顶点着色器与片元着色器之间数据传输的过程：顶点装配与光栅化。

5.[WebGL简易教程(五)：图形变换(模型、视图、投影变换)][netlink5]

详细讲解了OpenGL\WebGL关于绘制场景的图形变换过程，并推导了其图形变换矩阵。主要包括模型变换、视图变换以及投影变换。

6.[WebGL简易教程(六)：第一个三维示例(使用模型视图投影变换)][netlink6]

通过使用模型视图投影变换，完成第一个真正三维场景的示例：显示一组由远及近的三角形。

7.[WebGL简易教程(七)：绘制一个矩形体][netlink7]

通过一个绘制矩形包围盒的实例，进一步理解了模型视图投影变换。

8.[WebGL简易教程(八)：三维场景交互][netlink8]

基于之前教程的知识，实现了一个三维场景的浏览实例：通过鼠标实现场景的旋转和缩放。

9.[WebGL简易教程(九)：综合实例：地形的绘制][netlink9]

综合WebGL的知识，实现了绘制一张地形图的实例。

10.[WebGL简易教程(十)：光照][netlink10]

讲述了WebGL光照生成的原理，并作出了实际案例。

11.[WebGL简易教程(十一)：纹理][netlink11]

WebGL中使用纹理的实例：给地形贴上一张真实的纹理。

12.[WebGL简易教程(十二)：包围球与投影][netlink12]

通过包围球来设置模型视图投影变换，显示合适的渲染位置。

13.[WebGL简易教程(十三)：帧缓存对象(离屏渲染)][netlink13]

详细论述了WebGL中帧缓冲区技术的实现。

14.[WebGL简易教程(十四)：阴影][netlink14]

详述了WebGL中生成阴影的ShadowMap算法。

15.[WebGL简易教程(十五)：加载gltf模型][netlink15]

详述了通过WebGL读取、解析并显示glTF格式数据的过程。

# 3. 资源
其代码已经上传到GitHub：[地址](https://github.com/fafa1899/WebGLTutorial)。个人见解难免有所疏漏，欢迎大家来互相交流。

[imglink1]:https://github.com/fafa1899/WebGLTutorial/blob/master/1.gif
[imglink2]:https://github.com/fafa1899/WebGLTutorial/blob/master/2.gif

[netlink1]:https://blog.csdn.net/charlee44/article/details/98474589
[netlink2]:https://blog.csdn.net/charlee44/article/details/99174844
[netlink3]:https://blog.csdn.net/charlee44/article/details/100534038
[netlink4]:https://blog.csdn.net/charlee44/article/details/100830450
[netlink5]:https://blog.csdn.net/charlee44/article/details/102063461
[netlink6]:https://blog.csdn.net/charlee44/article/details/102173662
[netlink7]:https://blog.csdn.net/charlee44/article/details/102251822
[netlink8]:https://blog.csdn.net/charlee44/article/details/102258440
[netlink9]:https://blog.csdn.net/charlee44/article/details/102403912
[netlink10]:https://blog.csdn.net/charlee44/article/details/102536585
[netlink11]:https://blog.csdn.net/charlee44/article/details/102583215
[netlink12]:https://blog.csdn.net/charlee44/article/details/102992440
[netlink13]:https://blog.csdn.net/charlee44/article/details/103333252
[netlink14]:https://blog.csdn.net/charlee44/article/details/103435039
[netlink15]:https://blog.csdn.net/charlee44/article/details/104051809

