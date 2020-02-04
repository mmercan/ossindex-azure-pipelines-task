"use strict";
exports.__esModule = true;
var tl = require("azure-pipelines-task-lib/task");
var Analysis = /** @class */ (function () {
    function Analysis(projects) {
        this.projects = projects;
        this.defaultWorkingDirectory = "";
        this.status = 'NONE';
        this.vulnerableProjects = {};
        this.htmlcontent = "";
        this.defaultWorkingDirectory = tl.getVariable("System.DefaultWorkingDirectory") + "\\";
        this.getVulnerableProjects();
        this.htmlcontent = this.getHtmlAnalysisReport();
        //let stringgg = JSON.stringify(this.vulnerableProjects);
        //dconsole.info(this.htmlcontent);
    }
    Analysis.prototype.getVulnerableProjects = function () {
        //var vulnerableProjects: any = {};
        this.status = 'OK';
        for (var prj in this.projects) {
            var prjshort = prj.replace(this.defaultWorkingDirectory, "");
            for (var pck in this.projects[prj].packages) {
                if (this.projects[prj].packages[pck].vulnerabilities && this.projects[prj].packages[pck].vulnerabilities.length > 0) {
                    this.vulnerableProjects[prjshort] = this.projects[prj].packages[pck];
                    this.status = "WARN";
                }
            }
            ;
        }
        ;
    };
    Analysis.prototype.getHtmlAnalysisReport = function () {
        var qgStyle = "background-color: " + this.getvulnerabilityColor() + ";\n        padding: 4px 12px;\n        color: #fff;\n        letter-spacing: 0.02em;\n        line-height: 24px;\n        font-weight: 600;\n        font-size: 12px;\n        margin-left: 15px;";
        //     var html = `<div style="padding-top: 8px;">
        //     <span>${this.projectName ? this.projectName + ' ' : ''}Quality Gate</span>
        //     <span style="${qgStyle}">
        //       ${formatMeasure(this.status, 'LEVEL')}
        //     </span>
        //   </div>`;
        var html = "";
        for (var prj in this.projects) {
            html += "<p>" + prj + " </p>\n            <dl>";
            for (var pck in this.projects[prj].packages) {
                if (this.projects[prj].packages[pck].vulnerabilities && this.projects[prj].packages[pck].vulnerabilities.length > 0) {
                    html += "<dt>" + pck + "</dt>";
                    this.projects[prj].packages[pck].vulnerabilities.forEach(function (vul) {
                        html += "<dd> <strong> " + vul.severity + "  </strong> " + vul.description + "</dd>";
                    });
                }
            }
            html += "</dl>";
        }
        return html;
    };
    Analysis.prototype.getvulnerabilityColor = function () {
        switch (this.status) {
            case 'OK':
                return '#00aa00';
            case 'WARN':
                return '#ed7d20';
            case 'ERROR':
                return '#d4333f';
            case 'NONE':
                return '#b4b4b4';
            default:
                return '#b4b4b4';
        }
    };
    return Analysis;
}());
exports["default"] = Analysis;
