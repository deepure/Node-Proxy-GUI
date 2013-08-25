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