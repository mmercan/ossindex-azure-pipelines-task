"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var task = require("azure-pipelines-task-lib");
var tl = require("azure-pipelines-task-lib/task");
var fs = require("fs");
var path = require("path");
// import { request } from 'https';
var request = require("request");
var xml2js = require("xml2js");
task.setResourcePath(path.join(__dirname, 'task.json'));
var parser = new xml2js.Parser();
var globalPackageList = {};
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var filename, searchFordepsjson, projects, filePath, packageList, key, value, paged;
        return __generator(this, function (_a) {
            filename = task.getInput('fileName', true);
            searchFordepsjson = task.getBoolInput("searchdepsjsoninprojects", false);
            projects = [];
            filePath = tl.findMatch(tl.getVariable("System.DefaultWorkingDirectory"), filename)[0];
            console.info("Path is " + filePath);
            if (filePath.toLocaleLowerCase().endsWith('sln')) {
                console.info("Checking Projects in the Solution");
                projects = analyzeSolution(filePath);
            }
            else if (filePath.toLocaleLowerCase().endsWith('csproj')) {
                console.info("Checking Projects in the Solution");
                projects.push(filePath);
            }
            if (projects.length > 0) {
                projects.forEach(function (project) {
                    console.info("=== " + project + " ===");
                    if (searchFordepsjson) {
                        analyzeDepsjson(project);
                    }
                    else {
                        analyzeProject(project);
                    }
                });
            }
            console.info("===  unique PackageList  ===");
            packageList = [];
            for (key in globalPackageList) {
                packageList.push(key);
                console.info("===  " + key);
                value = globalPackageList[key];
            }
            paged = paginate(packageList, 100, 1);
            analyzePackages(paged);
            return [2 /*return*/];
        });
    });
}
function analyzeSolution(slnLocation) {
    var projects = [];
    var slnfolder = path.dirname(slnLocation);
    var filecontent = fs.readFileSync(slnLocation, 'utf8');
    //console.info(filecontent);
    var i = 0;
    filecontent.split(/\r?\n/).forEach(function (line) {
        if (!line.startsWith("Project")) {
            return;
        }
        var regex = new RegExp("(.*) = \"(.*?)\", \"(.*?.(cs|vb)proj)\"");
        var match = regex.exec(line);
        if (match && match.length > 0) {
            i++;
            //const fullprjlocation = tl.findMatch(slnfolder, match[3])[0];
            var fullprjlocation = path.join(slnfolder, match[3]);
            projects.push(fullprjlocation);
            console.log(i + " : " + fullprjlocation);
        }
    });
    return projects;
}
function analyzeProject(prjLocation) {
    var packages = [];
    var filecontent = fs.readFileSync(prjLocation, 'utf8');
    var i = 0;
    filecontent.split(/\r?\n/).forEach(function (line) {
        if (!line.trim().startsWith("<PackageReference")) {
            return;
        }
        parser.parseString(line, function (err, result) {
            var coordinate = "pkg:nuget/";
            // "pkg:nuget/EnterpriseLibrary.Common@6.0.1304"
            if (result.PackageReference) {
                if (result.PackageReference.$.Include) {
                    coordinate += result.PackageReference.$.Include + "@";
                    if (result.PackageReference.$.Version) {
                        coordinate += result.PackageReference.$.Version;
                        packages.push(coordinate);
                    }
                    else {
                        console.warn(result.PackageReference.$.Include + "Package doesn't have version number");
                    }
                }
                console.log(i + " : " + coordinate);
                if (!globalPackageList[coordinate]) {
                    globalPackageList[coordinate] = {};
                }
            }
        });
    });
    return packages;
}
function analyzePackages(packagecoordinates) {
    request.post("https://ossindex.sonatype.org/api/v3/component-report", { json: { coordinates: packagecoordinates } }, function (error, res, body) {
        if (error) {
            console.error(error);
            return;
        }
        console.log("statusCode: " + res.statusCode);
        console.log(body);
    });
}
function finddepjson(prjLocation) {
    var folder = path.dirname(prjLocation);
    var allPaths = tl.find(folder);
    var filteredPath = allPaths.filter(function (itemPath) { return itemPath.endsWith(".deps.json"); });
    console.info(filteredPath);
    return filteredPath;
}
function analyzeDepsjson(prjLocation) {
    var deps = finddepjson(prjLocation);
    deps.forEach(function (dep) {
        var packages = [];
        var filecontent = fs.readFileSync(dep, 'utf8');
        var content = JSON.parse(filecontent);
        if (content.libraries) {
            for (var key in content.libraries) {
                if (content.libraries.hasOwnProperty(key)) {
                    var coordinate = 'pkg:nuget/' + key.replace('/', '@');
                    console.log("" + coordinate);
                    if (!globalPackageList[coordinate]) {
                        globalPackageList[coordinate] = {};
                    }
                }
            }
        }
        var i = 0;
    });
}
function paginate(array, page_size, page_number) {
    --page_number; // because pages logically start with 1, but technically with 0
    return array.slice(page_number * page_size, (page_number + 1) * page_size);
}
run();
