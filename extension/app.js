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
var publish_1 = require("./publish");
task.setResourcePath(path.join(__dirname, 'task.json'));
var parser = new xml2js.Parser();
var globalPackageList = {};
var failifseverityhigher;
var shouldTaskFails = false;
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var filename, searchFordepsjson, projects, filePath, projectlist, packageList, key, prj, pck;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filename = task.getInput('fileName', true);
                    if (!filename) { }
                    ;
                    searchFordepsjson = task.getBoolInput("searchdepsjsoninprojects", false);
                    failifseverityhigher = task.getInput("failifseverityhigher", false);
                    if (!failifseverityhigher) {
                        failifseverityhigher = "None";
                    }
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
                    projectlist = {};
                    if (projects.length > 0) {
                        projects.forEach(function (project) {
                            projectlist[project] = { packages: undefined };
                            console.info("=== " + project + " ===");
                            if (searchFordepsjson) {
                                var packages = analyzeDepsjson(project);
                                projectlist[project].packages = packages;
                            }
                            else {
                                var packages = analyzeProject(project);
                                projectlist[project].packages = packages;
                            }
                        });
                    }
                    packageList = [];
                    for (key in globalPackageList) {
                        packageList.push(key);
                    }
                    return [4 /*yield*/, analyzeAllPackages(packageList)];
                case 1:
                    _a.sent();
                    for (prj in projectlist) {
                        for (pck in projectlist[prj].packages) {
                            if (globalPackageList[pck]) {
                                projectlist[prj].packages[pck] = globalPackageList[pck];
                            }
                        }
                    }
                    // for (let prj in projectlist) {
                    //     console.log("");
                    //     console.log(`${prj}`)
                    //     for (let pck in projectlist[prj].packages) {
                    //         consolepackageres(projectlist[prj].packages[pck])
                    //     };
                    // }
                    // console.log(`All Packages: ${packageList.length}`)
                    console.log("failifseverityhigher: " + failifseverityhigher);
                    console.log("shouldTaskFails: " + shouldTaskFails);
                    return [4 /*yield*/, publish_1["default"](projectlist)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
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
    var packages = {};
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
                    }
                    else {
                        console.warn(result.PackageReference.$.Include + "Package doesn't have version number");
                    }
                }
                // console.log(i + " : " + coordinate);
                if (!globalPackageList[coordinate]) {
                    globalPackageList[coordinate] = {};
                }
                if (!packages[coordinate]) {
                    packages[coordinate] = {};
                }
            }
        });
    });
    return packages;
}
function finddepjson(prjLocation) {
    var folder = path.dirname(prjLocation);
    var allPaths = tl.find(folder);
    var filteredPath = allPaths.filter(function (itemPath) { return itemPath.endsWith(".deps.json"); });
    console.info(filteredPath);
    return filteredPath;
}
function analyzeDepsjson(prjLocation) {
    var packages = {};
    var deps = finddepjson(prjLocation);
    deps.forEach(function (dep) {
        var numberoflibraries = 0;
        var filecontent = fs.readFileSync(dep, 'utf8');
        var content = JSON.parse(filecontent);
        if (content.libraries) {
            for (var key in content.libraries) {
                if (content.libraries.hasOwnProperty(key)) {
                    numberoflibraries++;
                    var coordinate = 'pkg:nuget/' + key.replace('/', '@');
                    if (!packages[coordinate]) {
                        packages[coordinate] = {};
                    }
                    if (!globalPackageList[coordinate]) {
                        globalPackageList[coordinate] = {};
                    }
                }
            }
        }
        console.log(dep + " >> " + numberoflibraries + " package found");
    });
    return packages;
}
function analyzeAllPackages(packagecoordinates) {
    return __awaiter(this, void 0, void 0, function () {
        var pageitem, allpages, totalpageNumber, index, paged, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pageitem = 127;
                    allpages = [];
                    totalpageNumber = Math.ceil(packagecoordinates.length / pageitem);
                    index = 0;
                    _a.label = 1;
                case 1:
                    if (!(index < totalpageNumber)) return [3 /*break*/, 6];
                    paged = paginate(packagecoordinates, pageitem, index);
                    allpages.push(paged);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, analyzePackages(paged)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.log("catch: " + error_1);
                    return [3 /*break*/, 5];
                case 5:
                    index++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/, allpages];
            }
        });
    });
}
function analyzePackages(packagecoordinates) {
    return new Promise(function (resolve, reject) {
        request.post("https://ossindex.sonatype.org/api/v3/component-report", { json: { coordinates: packagecoordinates } }, function (error, res, body) {
            if (error) {
                console.error(error);
                reject(error);
                return;
            }
            console.log("statusCode: " + res.statusCode);
            if (res.statusCode == 200) {
                body.forEach(function (pck) {
                    extractpackagedata(pck);
                });
                resolve(body);
            }
            else {
                reject(body);
            }
        });
    });
}
function extractpackagedata(pck) {
    var item = {};
    item.coordinates = pck.coordinates;
    if (pck.vulnerabilities.length > 0) {
        item.vulnerabilityText = "There are  " + pck.vulnerabilities.length + " vulnerabilities";
        item.vulnerabilityCount = pck.vulnerabilities.length;
        item.vulnerabilities = pck.vulnerabilities;
        item.vulnerabilities.forEach(function (vulnerability) {
            if (vulnerability.cvssScore) {
                if (vulnerability.cvssScore >= 0.1 && vulnerability.cvssScore <= 3.9) {
                    vulnerability.severity = "LOW";
                    if (failifseverityhigher == "LOW") {
                        shouldTaskFails = true;
                        vulnerability.TaskFailed = "Task Will Fail";
                    }
                }
                if (vulnerability.cvssScore >= 4.0 && vulnerability.cvssScore <= 6.9) {
                    vulnerability.severity = "MEDIUM";
                    // severityForegroundColor = ConsoleColor.Yellow;
                    if (failifseverityhigher == "LOW" || failifseverityhigher == "MEDIUM") {
                        shouldTaskFails = true;
                        vulnerability.TaskFailed = "Task Will Fail";
                    }
                }
                if (vulnerability.cvssScore >= 7.0 && vulnerability.cvssScore <= 8.9) {
                    vulnerability.severity = "HIGH";
                    // severityForegroundColor = ConsoleColor.Red;
                    if (failifseverityhigher == "LOW" || failifseverityhigher == "MEDIUM" ||
                        failifseverityhigher == "HIGH") {
                        shouldTaskFails = true;
                        vulnerability.TaskFailed = "Task Will Fail";
                    }
                }
                if (vulnerability.cvssScore >= 9.0) {
                    vulnerability.severity = "CRITICAL";
                    // severityForegroundColor = ConsoleColor.Red;
                    if (failifseverityhigher == "LOW" || failifseverityhigher == "MEDIUM" ||
                        failifseverityhigher == "HIGH" || failifseverityhigher == "CRITICAL") {
                        shouldTaskFails = true;
                        vulnerability.TaskFailed = "Task Will Fail";
                    }
                }
            }
        });
    }
    else {
        item.vulnerabilityText = "There is no vulnerability";
        item.vulnerabilityCount = 0;
        item.vulnerabilities = {};
    }
    if (globalPackageList[item.coordinates]) {
        globalPackageList[item.coordinates] = item;
    }
    else {
        console.log("****************** " + item.coordinates + " not found to add to globalPackageList ******************************");
    }
    // globalVulnerabilityList.push(item);
    // consolepackageres(item);
    //console.log(JSON.stringify(item));
}
function paginate(array, page_size, page_number) {
    return array.slice(page_number * page_size, (page_number + 1) * page_size);
}
function consolepackageres(item) {
    // console.log(JSON.stringify(item));
    var message = "";
    message = "   " + item.coordinates + " " + item.vulnerabilityText;
    console.log(message);
    if (item.vulnerabilityCount > 0) {
        item.vulnerabilities.forEach(function (vulnerability) {
            var vulnerabilityText = "    " + vulnerability.severity + " severity :  " + vulnerability.title + " ";
            console.log("       " + vulnerabilityText);
            console.log("       " + vulnerability.description);
            console.log("       " + vulnerability.reference);
        });
    }
}
run();
