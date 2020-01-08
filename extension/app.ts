import task = require('azure-pipelines-task-lib');
import tl = require('azure-pipelines-task-lib/task');
import trm = require('azure-pipelines-task-lib/toolrunner');
import fs = require('fs');
import path = require('path');
// import { request } from 'https';
import request = require('request');
import { error } from 'azure-pipelines-task-lib';
import xml2js = require('xml2js');
task.setResourcePath(path.join(__dirname, 'task.json'));

var parser = new xml2js.Parser();
var globalPackageList: any = {};
async function run() {
    let filename: string = task.getInput('fileName', true);
    let searchFordepsjson: boolean = task.getBoolInput("searchdepsjsoninprojects", false);
    let projects: string[] = [];
    const filePath = tl.findMatch(tl.getVariable("System.DefaultWorkingDirectory"), filename)[0];

    console.info("Path is " + filePath);
    if (filePath.toLocaleLowerCase().endsWith('sln')) {
        console.info("Checking Projects in the Solution");
        projects = analyzeSolution(filePath);
    } else if (filePath.toLocaleLowerCase().endsWith('csproj')) {
        console.info("Checking Projects in the Solution");
        projects.push(filePath);
    }

    if (projects.length > 0) {
        projects.forEach(function (project) {
            console.info("=== " + project + " ===");
            if (searchFordepsjson) {
                analyzeDepsjson(project);
            } else {
                analyzeProject(project);
            }
        });
    }

    console.info("===  unique PackageList  ===");
    let packageList = [];
    for (var key in globalPackageList) {
        packageList.push(key);
        console.info("===  " + key);
        var value = globalPackageList[key];
    }
    let paged = paginate(packageList, 100, 1)
    analyzePackages(paged);
}

function analyzeSolution(slnLocation: string): string[] {
    let projects: string[] = [];
    let slnfolder = path.dirname(slnLocation)
    let filecontent = fs.readFileSync(slnLocation, 'utf8');
    //console.info(filecontent);
    let i = 0;
    filecontent.split(/\r?\n/).forEach(function (line) {
        if (!line.startsWith("Project")) {
            return;
        }
        var regex = new RegExp("(.*) = \"(.*?)\", \"(.*?.(cs|vb)proj)\"");
        var match = regex.exec(line);
        if (match && match.length > 0) {
            i++;
            //const fullprjlocation = tl.findMatch(slnfolder, match[3])[0];
            const fullprjlocation = path.join(slnfolder, match[3])
            projects.push(fullprjlocation);
            console.log(i + " : " + fullprjlocation);
        }
    });
    return projects;
}

function analyzeProject(prjLocation: string): string[] {
    let packages: string[] = [];
    let filecontent = fs.readFileSync(prjLocation, 'utf8');

    let i = 0;
    filecontent.split(/\r?\n/).forEach(function (line) {
        if (!line.trim().startsWith("<PackageReference")) {
            return;
        }
        parser.parseString(line, function (err: any, result: any) {
            let coordinate = "pkg:nuget/";
            // "pkg:nuget/EnterpriseLibrary.Common@6.0.1304"
            if (result.PackageReference) {
                if (result.PackageReference.$.Include) {
                    coordinate += result.PackageReference.$.Include + "@"
                    if (result.PackageReference.$.Version) {
                        coordinate += result.PackageReference.$.Version
                        packages.push(coordinate);
                    } else {
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

function analyzePackages(packagecoordinates: string[]) {
    request.post("https://ossindex.sonatype.org/api/v3/component-report",
        { json: { coordinates: packagecoordinates } }
        , (error, res, body) => {
            if (error) {
                console.error(error)
                return
            }
            console.log(`statusCode: ${res.statusCode}`)
            console.log(body)
        });
}

function finddepjson(prjLocation: string): string[] {
    let folder = path.dirname(prjLocation)
    let allPaths: string[] = tl.find(folder);
    let filteredPath = allPaths.filter((itemPath: string) => itemPath.endsWith(".deps.json"));
    console.info(filteredPath);
    return filteredPath;
}

function analyzeDepsjson(prjLocation: string): string[] {
    let deps = finddepjson(prjLocation);
    deps.forEach((dep) => {


        let packages: string[] = [];
        let filecontent = fs.readFileSync(dep, 'utf8');
        let content = JSON.parse(filecontent);
        if (content.libraries) {
            for (let key in content.libraries) {
                if (content.libraries.hasOwnProperty(key)) {

                    let coordinate = 'pkg:nuget/' + key.replace('/', '@');
                    console.log(`${coordinate}`);

                    if (!globalPackageList[coordinate]) {
                        globalPackageList[coordinate] = {};
                    }
                }
            }
        }
        let i = 0;

    });
}


function paginate(array: any[], page_size: number, page_number: number) {
    --page_number; // because pages logically start with 1, but technically with 0
    return array.slice(page_number * page_size, (page_number + 1) * page_size);
}


run();