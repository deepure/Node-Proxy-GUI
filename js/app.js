'use strict';

var httpProxy = require('http-proxy'),
	Storage = require('dom-storage'),
	gui = require('nw.gui'),
	_ = require('underscore'),
	fs = require('fs');


// 初始化Server
var Proxyserver = httpProxy.createServer(9000,'localhost');

// 读取localstorage配置
var	localStorage = new Storage('./db.json');
var routerGet = JSON.parse(localStorage.getItem('router'));
if (localStorage.length ===0 || routerGet.length === 0 ) {
	routerGet =[{"origin": "","target":"","port":""}];
}

// 最小化到状态栏

// Reference to window and tray
var win = gui.Window.get();
var tray;

// Get the minimize event
win.on('minimize', function() {
  // Hide window
  this.hide();

  // Show tray
  tray = new gui.Tray({ icon: 'icon.png' });

  // Show window and remove tray when clicked
  tray.on('click', function() {
    win.show();
    this.remove();
    tray = null;
  });
});

/* Controllers */
function ProxyListCtrl($scope) {
	$scope.routes = routerGet;
	$scope.pState = false;
	$scope.start = function(){
		var proxyRouter = {};
		// 将空值去除并转换为代理配置
		_.each($scope.routes,function(item,index){
			if (item.origin == "") {
				return false;
			} else if (item.port != "") {
				proxyRouter[item.origin] = item.target + ":" + item.port;
			} else {
				proxyRouter[item.origin] = item.target;
			}
		});
		var options = {
			router: proxyRouter
		};
		// 启动代理
		Proxyserver = httpProxy.createServer(options);
		Proxyserver.listen(80,function(){
		});
		// 去除hashKey
		var delhaskKey = _.map($scope.routes,function(item){
			delete item.$$hashKey;
			return item;
		})
		// 将空值去除并存入localstorage
		var proxySave = _.reject(delhaskKey,function(item){
			return item.origin == "";
		});
		localStorage.setItem('router',JSON.stringify(proxySave));
	};
	$scope.stop = function(){
		Proxyserver.close(function(){
		});
	};
	$scope.addProxy = function() {
		$scope.routes.push({"origin": "","target":"","port":""});
	};
	// 打开HOSTS文件
	$scope.open = function(){
		gui.Shell.openItem('C:/Windows/System32/drivers/etc/hosts');
	};
	$scope.switch = function() {
		if($scope.pState == true ) {
			$scope.start();
		} else {
			$scope.stop();
		}

	}
}

// 弹出提示
var msgTip = function(msg){
	var updateBox = '<div class="modal fade" id="update" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h4 class="modal-title">Update</h4></div><div class="modal-body">'+ msg +'</div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div></div></div></div>';
	$('body').append(updateBox);
	$('#update').modal('show');
};

// 升级提示
var updateMsg = function(version,link){
	var downLoad = '<a href="' +link+ '">有新版本' + version + ' 点击下载</a>';
	return downLoad;
};

// 版本检查
var  latestVersion = {
	"version"	: 	"0.2.0",
	"link"		: 	"http://img.vemic.com/fetool/proxy.zip"
};
fs.readFile('./package.json',function(err,data){
	var currentVersion = JSON.parse(data).version;
	if (currentVersion != latestVersion.version) {
		msgTip(updateMsg(latestVersion.version , latestVersion.link));
	}
});