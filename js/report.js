// 🟢 PENDING REPORT LOGIC
function generatePendingReport() {
    const selMonth = document.getElementById('reportMonth').value;
    const selYear = document.getElementById('reportYear').value;
    const reportFormSelect = document.getElementById('reportFormSelect').value;
    
    if (selMonth === "सर्व" || selYear === "सर्व") { alert("विशिष्ट 'महिना' आणि 'वर्ष' निवडा!"); return; }

    let groupedData = {}; 
    let filterRole = "सर्व";
    if (document.getElementById('reportRoleFilter')) {
        filterRole = document.getElementById('reportRoleFilter').value;
    }

    let formsToCheck = masterData.forms.filter(f => !isFormInactive(f));
    
    if(reportFormSelect !== "ALL" && reportFormSelect !== "") {
        formsToCheck = formsToCheck.filter(f => f.FormID === reportFormSelect);
    }

    formsToCheck.forEach(f => {
        let allowedRoles = f.AllowedRoles ? f.AllowedRoles.split(',').map(r=>String(r).trim().toUpperCase()) : ["ALL"];
        let isAllForm = allowedRoles.includes("ALL");
        groupedData[f.FormName] = [];

        masterData.users.forEach(u => {
            let isAdmin = (user.role === "Admin" || user.role === "VIEWER" || user.role === "MANAGER");
            
            if (!isAdmin && String(u.mobile).trim() !== String(user.mobile).trim()) return;
            if (isAdmin && filterRole !== "सर्व" && u.role !== filterRole) return;

            if (isAllForm || allowedRoles.includes(u.role)) {
                let userVillages = masterData.villages.filter(v => String(v.SubCenterID).trim().toLowerCase() === String(u.subcenter).trim().toLowerCase());
                userVillages.forEach(v => {
                    let isFilled = masterData.filledStats.some(h => 
                        h.formID === f.FormID && String(h.village).trim() === String(v.VillageName).trim() && 
                        String(h.month).trim() === selMonth && String(h.year).trim() === selYear
                    );
                    if (!isFilled) {
                        groupedData[f.FormName].push({ sc: u.subcenter, name: u.name, role: u.role, village: v.VillageName });
                    }
                });
            }
        });
    });

    let container = document.getElementById('reportTableContainer');
    let downArea = document.getElementById('downloadButtonsArea');
    
    downArea.innerHTML = `
        <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap;">
            <button onclick="copyPendingListText()" style="background:#6c757d; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">📋 यादी कॉपी करा (WhatsApp साठी)</button>
            <button onclick="downloadPendingPDF()" style="background:#e74c3c; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">📥 PDF डाउनलोड करा</button>
        </div>
    `;
    
    let html = `<div id="pdfExportArea" class="pdf-container">
        <h2 style="text-align:center; color:#c0392b; border-bottom: 2px solid #ccc; padding-bottom:10px;">अपूर्ण अहवाल यादी (${selMonth} ${selYear})</h2>`;
    
    let hasData = false;
    for(let fName in groupedData) {
        if(groupedData[fName].length > 0) {
            hasData = true;
            html += `<div class="pdf-group-header">📄 फॉर्म: ${fName}</div>`;
            html += `<table class="report-table pending-data-table" style="width:100%; border-collapse:collapse; margin-bottom:30px;">
                <thead style="background:#f4f7f6;"><tr>
                <th style="border: 1px solid #ccc; padding: 8px; width:10%; text-align:center;">अ.क्र.</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align:left;">अहवाल अप्राप्त असणारे कर्मचारी (उपकेंद्र) - अपूर्ण गावे</th>
                </tr></thead><tbody>`;
            
            let empMap = {};
            groupedData[fName].forEach(p => {
                let key = p.name + "###" + p.sc;
                if(!empMap[key]) empMap[key] = [];
                empMap[key].push(p.village);
            });

            let idx = 1;
            let sortedKeys = Object.keys(empMap).sort(); 
            
            sortedKeys.forEach(key => {
                let [empName, scName] = key.split("###");
                let villagesStr = empMap[key].join(", ");

                html += `<tr>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align:center; font-weight:bold;">${idx++}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align:left; font-size:15px;" class="copy-target-cell">
                        <span style="color:#0056b3; font-weight:bold;">${empName}</span> - 
                        <span style="color:#d35400; font-weight:bold;">${scName}</span> 
                        <span style="color:#28a745; font-weight:bold;">(${villagesStr})</span>
                    </td>
                </tr>`;
            });
            
            html += `</tbody></table>`;
        }
    }

    if(!hasData) { html = `<h3 style="text-align:center; color:green; padding:30px;">🎉 उत्कृष्ट! तुमचे सर्व अहवाल पूर्ण भरले आहेत.</h3>`; downArea.innerHTML = ""; }
    container.innerHTML = html + `</div>`;
    document.getElementById('reportContentArea').classList.remove('hidden');
}

// 🟢 Text Copy Function
function copyPendingListText() {
    const selMonth = document.getElementById('reportMonth').value;
    const selYear = document.getElementById('reportYear').value;
    
    let textToCopy = `*अहवाल अप्राप्त यादी (${selMonth} ${selYear})*\n\n`;
    
    let tables = document.querySelectorAll('.pending-data-table');
    if(tables.length === 0) {
        alert("कॉपी करण्यासाठी कोणतीही माहिती नाही.");
        return;
    }

    let formHeaders = document.querySelectorAll('.pdf-group-header');
    
    tables.forEach((table, tableIndex) => {
        let formName = formHeaders[tableIndex] ? formHeaders[tableIndex].innerText.replace('📄 फॉर्म: ', '').trim() : "अहवाल";
        textToCopy += `📌 *${formName}*\n`;
        
        let rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, rowIndex) => {
            let cells = row.querySelectorAll('td');
            if(cells.length >= 2) {
                let details = cells[1].innerText.replace(/\n/g, " ").trim();
                textToCopy += `${rowIndex + 1}. ${details}\n`;
            }
        });
        textToCopy += `\n`;
    });

    navigator.clipboard.writeText(textToCopy).then(() => {
        alert("✅ यादी यशस्वीरित्या कॉपी झाली! आता तुम्ही ती WhatsApp वर Paste करू शकता.");
    }).catch(err => {
        let tempInput = document.createElement("textarea");
        tempInput.value = textToCopy;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        alert("✅ यादी यशस्वीरित्या कॉपी झाली! आता तुम्ही ती WhatsApp वर Paste करू शकता.");
    });
}

// 🟢 Text-Copyable PDF Logic (Using Hidden Iframe)
function downloadPendingPDF() {
    const selMonth = document.getElementById('reportMonth').value;
    const selYear = document.getElementById('reportYear').value;
    const printContent = document.getElementById('pdfExportArea').innerHTML;

    let oldFrame = document.getElementById('pdfPrintFrame');
    if (oldFrame) { oldFrame.remove(); }

    const iframe = document.createElement('iframe');
    iframe.id = 'pdfPrintFrame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    let doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>अहवाल_अप्राप्त_यादी_${selMonth}_${selYear}</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #000; }
                h2 { text-align: center; color: #c0392b; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
                .pdf-group-header { background: #f8f9fa; color: #c0392b; padding: 10px; font-weight: bold; font-size: 16px; margin-top: 20px; border-bottom: 1px solid #c0392b; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 14px; }
                th { background-color: #f2f2f2; font-weight: bold; }
                td:first-child, th:first-child { text-align: center; width: 10%; }
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style>
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `);
    doc.close();

    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 800);
}

function getTotalsRow(data, headers, showIndices) {
    let totals = Array(headers.length).fill(0);
    let isNumericCol = Array(headers.length).fill(false);
    for(let c of showIndices) {
        let colName = headers[c] || "";
        if(colName.includes("मोबाईल") || colName.includes("क्रमांक") || colName === "तारीख" || colName === "महिना" || colName === "वर्ष" || colName === "उपकेंद्र" || colName === "गाव" || colName === "ग्रामपंचायत" || colName.includes("नाव") || colName.includes("स्तर")) { continue; }
        let isNum = false; let colSum = 0;
        for(let r=1; r<data.length; r++) {
            let val = String(data[r][c] || "").trim();
            if(val !== "" && val !== "-") { if(!isNaN(val)) { isNum = true; colSum += parseFloat(val); } else { isNum = false; break; } }
        }
        if(isNum) { isNumericCol[c] = true; totals[c] = colSum; }
    }
    return { totals, isNumericCol };
}

function getProgressiveTargetMonthsAndYears(selM, selY) {
    const months = ["जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"];
    const fyStartMonthIdx = 3; 
    let selectedMonthIdx = months.indexOf(selM);
    let sYear = parseInt(selY);

    let result = [];
    if (selectedMonthIdx >= fyStartMonthIdx) {
        for(let i = fyStartMonthIdx; i <= selectedMonthIdx; i++) { result.push({m: months[i], y: String(sYear)}); }
    } else {
        for(let i = fyStartMonthIdx; i <= 11; i++) { result.push({m: months[i], y: String(sYear - 1)}); }
        for(let i = 0; i <= selectedMonthIdx; i++) { result.push({m: months[i], y: String(sYear)}); }
    }
    return result;
}

// 🟢 REPORT FETCHING LOGIC (With Nil Report Filter)
async function fetchReportData() {
    const formID = document.getElementById('reportFormSelect').value;
    const selMonth = document.getElementById('reportMonth').value;
    const selYear = document.getElementById('reportYear').value;

    if(!formID) { alert("कृपया अहवाल निवडा"); return; }

    let filterRole = "सर्व";
    if((user.role === "Admin" || user.role === "VIEWER" || user.role === "MANAGER") && document.getElementById('reportRoleFilter')) {
        filterRole = document.getElementById('reportRoleFilter').value;
    }

    document.getElementById('reportLoader').style.display = "block";
    document.getElementById('reportContentArea').classList.add('hidden');
    document.getElementById('reportTableContainer').innerHTML = "";

    try {
        const payload = { formID: formID, role: user.role, subcenter: user.subcenter, mobileNo: user.mobile, filterRole: filterRole };
        const r = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({action:"getReportData", payload}) });
        const textResponse = await r.text();
        if(textResponse.trim().startsWith("<")) throw new Error("Google Server Blocked the Request.");
        const d = JSON.parse(textResponse);
        document.getElementById('reportLoader').style.display = "none";

        if(d.success) {
            if(d.reports && d.reports.length > 0) {
                let finalReports = [];
                d.reports.forEach(rep => {
                    let headers = rep.data[0];
                    if(!headers) return;

                    // 🟢 फिल्टर: निरंक अहवाल (Nil Reports) काढून टाकणे
                    let validData = [headers];
                    for(let i=1; i<rep.data.length; i++) {
                        let isNil = rep.data[i].some(cell => String(cell).includes("निरंक (Nil Report)"));
                        if(!isNil) validData.push(rep.data[i]);
                    }
                    rep.data = validData;

                    const formObj = masterData.forms.find(x => x.FormName === rep.formName);
                    let formTypeStr = formObj ? String(formObj.FormType).trim() : "";
                    let isProgressive = formTypeStr.includes('ProgressiveStats');
                    let isVertical = formTypeStr.includes('Vertical');
                    let isList = formTypeStr.includes('List'); 

                    let monthIdx = headers.indexOf("महिना");
                    let yearIdx = headers.indexOf("वर्ष");
                    let villageIdx = headers.indexOf("गाव");
                    if(villageIdx === -1) villageIdx = headers.indexOf("Village"); 

                    let fData = [];
                    let dataRows = [];

                    if (isProgressive && !isVertical && selMonth !== "सर्व" && selYear !== "सर्व") {
                        let flatFields = extractFieldsFromForm(formObj);
                        let numericLabels = flatFields.filter(f => f.orig.type === 'number' || f.orig.type === 'sum').map(f => f.label);
                        let newHeaders = []; let numMap = {}; 
                        headers.forEach((h, i) => {
                            if (numericLabels.includes(h)) { newHeaders.push(`${h} - मासिक`); newHeaders.push(`${h} - प्रगत`); numMap[i] = true; } 
                            else { newHeaders.push(h); }
                        });
                        fData.push(newHeaders);
                        let targetPeriods = getProgressiveTargetMonthsAndYears(selMonth, selYear);
                        let villageData = {};

                        for(let i=1; i<rep.data.length; i++) {
                            let row = rep.data[i];
                            let m = String(row[monthIdx]).trim(); let y = String(row[yearIdx]).trim(); let v = String(row[villageIdx] || "").trim();
                            if(targetPeriods.some(p => p.m === m && p.y === y)) {
                                let sc = headers.indexOf("उपकेंद्र") > -1 ? String(row[headers.indexOf("उपकेंद्र")]).trim() : "";
                                let mob = headers.indexOf("मोबाईल क्र.") > -1 ? String(row[headers.indexOf("मोबाईल क्र.")]).trim() : "";
                                let gKey = `${sc}_${mob}_${v}`;
                                if(!villageData[gKey]) {
                                    villageData[gKey] = { baseRow: Array(headers.length).fill("-"), progressive: {}, monthly: {} };
                                    headers.forEach((_, cIdx) => { if(!numMap[cIdx]) villageData[gKey].baseRow[cIdx] = row[cIdx]; });
                                }
                                if (m === selMonth && y === selYear) { headers.forEach((_, cIdx) => { if(!numMap[cIdx]) villageData[gKey].baseRow[cIdx] = row[cIdx]; }); }
                                headers.forEach((_, cIdx) => {
                                    if (numMap[cIdx]) {
                                        let val = parseFloat(row[cIdx]);
                                        if(!isNaN(val)) {
                                            villageData[gKey].progressive[cIdx] = (villageData[gKey].progressive[cIdx] || 0) + val;
                                            if (m === selMonth && y === selYear) { villageData[gKey].monthly[cIdx] = val; }
                                        }
                                    }
                                });
                            }
                        }

                        Object.keys(villageData).forEach(k => {
                            let vData = villageData[k]; let newRow = [];
                            headers.forEach((h, cIdx) => {
                                if (numMap[cIdx]) { newRow.push(vData.monthly[cIdx] !== undefined ? vData.monthly[cIdx] : 0); newRow.push(vData.progressive[cIdx] !== undefined ? vData.progressive[cIdx] : 0); } 
                                else { newRow.push(vData.baseRow[cIdx] !== undefined ? vData.baseRow[cIdx] : "-"); }
                            });
                            if(monthIdx > -1) newRow[monthIdx] = selMonth; if(yearIdx > -1) newRow[yearIdx] = selYear;
                            dataRows.push(newRow);
                        });
                    } else if (isProgressive && isVertical && selMonth !== "सर्व" && selYear !== "सर्व") {
                        fData.push(headers); 
                        let targetPeriods = getProgressiveTargetMonthsAndYears(selMonth, selYear);
                        let villageData = {};
                        let flatFields = extractFieldsFromForm(formObj);
                        let numericLabels = flatFields.filter(f => f.orig.type === 'number' || f.orig.type === 'sum').map(f => f.label);
                        let numMap = {};
                        headers.forEach((h, i) => { if (numericLabels.includes(h)) numMap[i] = true; });

                        for(let i=1; i<rep.data.length; i++) {
                            let row = rep.data[i];
                            let m = String(row[monthIdx]).trim(); let y = String(row[yearIdx]).trim(); let v = String(row[villageIdx] || "").trim();
                            if(targetPeriods.some(p => p.m === m && p.y === y)) {
                                let sc = headers.indexOf("उपकेंद्र") > -1 ? String(row[headers.indexOf("उपकेंद्र")]).trim() : "";
                                let mob = headers.indexOf("मोबाईल क्र.") > -1 ? String(row[headers.indexOf("मोबाईल क्र.")]).trim() : "";
                                let gKey = `${sc}_${mob}_${v}`;
                                if(!villageData[gKey]) {
                                    villageData[gKey] = { baseRow: Array(headers.length).fill("-"), progressive: {}, monthly: {} };
                                    headers.forEach((_, cIdx) => { if(!numMap[cIdx]) villageData[gKey].baseRow[cIdx] = row[cIdx]; });
                                }
                                if (m === selMonth && y === selYear) { headers.forEach((_, cIdx) => { if(!numMap[cIdx]) villageData[gKey].baseRow[cIdx] = row[cIdx]; }); }
                                headers.forEach((_, cIdx) => {
                                    if (numMap[cIdx]) {
                                        let val = parseFloat(row[cIdx]);
                                        if(!isNaN(val)) {
                                            villageData[gKey].progressive[cIdx] = (villageData[gKey].progressive[cIdx] || 0) + val;
                                            if (m === selMonth && y === selYear) { villageData[gKey].monthly[cIdx] = val; }
                                        }
                                    }
                                });
                            }
                        }

                        Object.keys(villageData).forEach(k => {
                            let vData = villageData[k]; let newRow = [];
                            headers.forEach((h, cIdx) => {
                                if (numMap[cIdx]) { newRow.push({ M: vData.monthly[cIdx] || 0, P: vData.progressive[cIdx] || 0 }); } 
                                else { newRow.push(vData.baseRow[cIdx] !== undefined ? vData.baseRow[cIdx] : "-"); }
                            });
                            if(monthIdx > -1) newRow[monthIdx] = selMonth; if(yearIdx > -1) newRow[yearIdx] = selYear;
                            dataRows.push(newRow);
                        });
                    } else {
                        fData.push(headers);
                        for(let i=1; i<rep.data.length; i++) {
                            let row = rep.data[i];
                            let matchMonth = (selMonth === "सर्व" || String(row[monthIdx]).trim() === String(selMonth).trim());
                            let matchYear = (selYear === "सर्व" || String(row[yearIdx]).trim() === String(selYear).trim());
                            if(matchMonth && matchYear) dataRows.push(row);
                        }
                    }

                    fData = fData.concat(dataRows);
                    finalReports.push({ formName: rep.formName, data: fData, isList: isList }); 
                });

                if(finalReports.length > 0) {
                    currentReports = finalReports;
                    renderMultipleTables(finalReports, selMonth, selYear);
                    document.getElementById('reportContentArea').classList.remove('hidden');
                } else { alert("निवडलेल्या महिना आणि वर्षासाठी कोणताही डेटा उपलब्ध नाही."); }
            } else { alert("अद्याप कोणतीही माहिती उपलब्ध नाही."); }
        } else { alert("सर्व्हरकडून माहिती मिळाली नाही."); }
    } catch(e) {
        document.getElementById('reportLoader').style.display = "none";
        alert("एरर: " + e.message);
    }
}

function renderMultipleTables(reports, month, year) {
    let container = document.getElementById('reportTableContainer');
    let downArea = document.getElementById('downloadButtonsArea');
    
    // डाउनलोड बटण आधीच्या HTML ला न काढता त्यात जोडण्यासाठी += वापरा (किंवा insertAdjacentHTML वापरा)
    let excelBtnHtml = `<button onclick="downloadConsolidatedExcel()" style="background:#28a745; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold; font-size: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom:15px; width:100%;">📥 Excel (.xlsx) डाउनलोड करा</button>`;
    
    let html = excelBtnHtml;
    let periodText = (month === 'सर्व' && year === 'सर्व') ? 'सर्व महिने' : `${month} ${year !== 'सर्व' ? year : ''}`;

    reports.forEach(rep => {
        let data = rep.data;
        let headers = data[0];
        let showIndices = [];
        headers.forEach((h, i) => { if(!CONFIG.hiddenColumns.includes(h) && h !== "गाव" && h !== "Village") showIndices.push(i); });
        
        const formObj = masterData.forms.find(x => x.FormName === rep.formName);
        const formType = formObj ? String(formObj.FormType).trim() : "";
        const isStats = formType.includes('Stats');
        const isProgressive = formType.includes('ProgressiveStats');
        const isVertical = formType.includes('Vertical'); 
        const isList = formType.includes('List'); 

        let subCenterIdx = headers.indexOf("उपकेंद्र");
        let nameIdx = headers.indexOf("कर्मचाऱ्याचे नाव");
        let mobIdx = headers.indexOf("मोबाईल क्र.");
        let villageIdx = headers.indexOf("गाव");

        let dataRows = data.slice(1);
        let groups = {};

        if(dataRows.length === 0) { 
            groups["All"] = []; 
        } else if (isList) {
            groups["संपूर्ण तालुक्याची यादी (All Subcenters)###एकत्रित"] = dataRows;
            groups["संपूर्ण तालुक्याची यादी (All Subcenters)###एकत्रित"].sort((a,b) => {
                let scA = subCenterIdx > -1 ? String(a[subCenterIdx]||"") : ""; let scB = subCenterIdx > -1 ? String(b[subCenterIdx]||"") : "";
                if(scA !== scB) return scA.localeCompare(scB);
                let vA = villageIdx > -1 ? String(a[villageIdx]||"") : ""; let vB = villageIdx > -1 ? String(b[villageIdx]||"") : "";
                return vA.localeCompare(vB);
            });
        } else {
            dataRows.forEach(row => {
                let sc = subCenterIdx > -1 ? String(row[subCenterIdx] || "").trim() : "Unknown";
                let mob = mobIdx > -1 ? String(row[mobIdx] || "").trim() : "Unknown";
                let ename = nameIdx > -1 ? String(row[nameIdx] || "").trim() : mob;
                if(ename === "undefined" || ename === "") ename = mob;
                let key = sc + "###" + ename;
                if(!groups[key]) groups[key] = [];
                groups[key].push(row);
            });
        }

        let groupKeys = Object.keys(groups).sort();
        html += `<div style="background:white; padding:15px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.1); margin-bottom:20px;">`;
        html += `<h3 style="color:var(--primary); border-bottom:2px solid var(--primary); padding-bottom:10px;">${rep.formName} अहवाल</h3>`;

        groupKeys.forEach((gKey) => {
            let gRows = groups[gKey];
            let [sc, ename] = gKey.split("###");

            if(!isList && villageIdx > -1) { gRows.sort((a, b) => String(a[villageIdx]||"").localeCompare(String(b[villageIdx]||""))); }

            if(dataRows.length > 0) {
                html += `<div style="background:#e8f4f8; padding:10px; border-left:5px solid var(--secondary); margin-top:20px; font-weight:bold; color:#0056b3; border-radius:4px;">
                उपकेंद्र: <span style="color:#333;">${sc}</span> &nbsp;&nbsp;|&nbsp;&nbsp; कर्मचारी: <span style="color:#333;">${ename}</span> &nbsp;&nbsp;|&nbsp;&nbsp; अहवाल महिना: <span style="color:#333;">${periodText}</span>
                </div>`;
            }

            if(isVertical) {
                let baseVariables = [];
                showIndices.forEach(idx => { baseVariables.push({ name: headers[idx], isProg: isProgressive, idxM: idx, idxP: idx }); });

                let r1Html = `<tr><th ${isProgressive ? 'rowspan="2"' : ''} style="background:#f4b400; color:#000; border:1px solid #ddd; text-align:center; position:sticky; left:0; z-index:2;">अ.क्र.</th><th ${isProgressive ? 'rowspan="2"' : ''} style="background:#f4b400; color:#000; border:1px solid #ddd; text-align:center; position:sticky; left:45px; z-index:2;">तपशील / प्रश्न</th>`;
                let r2Html = isProgressive ? `<tr>` : "";

                gRows.forEach((row) => {
                    let vName = row[villageIdx] || "-";
                    r1Html += `<th ${isProgressive ? 'colspan="2"' : ''} style="background:#ffe082; color:#000; border:1px solid #ddd; text-align:center;">${vName}</th>`;
                    if (isProgressive) { r2Html += `<th style="background:#fff3e0; color:#000; border:1px solid #ddd; text-align:center; font-size:12px;">मासिक</th><th style="background:#fff3e0; color:#000; border:1px solid #ddd; text-align:center; font-size:12px;">प्रगत</th>`; }
                });
                
                r1Html += `<th ${isProgressive ? 'colspan="2"' : ''} style="background:#81c784; color:#000; border:1px solid #ddd; text-align:center;">एकूण</th></tr>`;
                if (isProgressive) { r2Html += `<th style="background:#c8e6c9; color:#000; border:1px solid #ddd; text-align:center; font-size:12px;">मासिक</th><th style="background:#c8e6c9; color:#000; border:1px solid #ddd; text-align:center; font-size:12px;">प्रगत</th></tr>`; }

                let theadHtml = r1Html + r2Html;
                let tbodyHtml = "";

                if(gRows.length === 0) {
                    tbodyHtml += `<tr><td colspan="10" style="color:red; font-weight:bold; font-size:16px;">निरंक (Nil)</td></tr>`;
                } else {
                    baseVariables.forEach((v, vIndex) => {
                        tbodyHtml += `<tr><td class="sticky-col" style="background:#fdfdfd; left:0; z-index:1; text-align:center;">${vIndex+1}</td><td class="sticky-col" style="background:#fdfdfd; left:45px; z-index:1; text-align:left; font-weight:bold; white-space:nowrap;">${String(v.name).trim()}</td>`;
                        let rowTotM = 0; let rowTotP = 0;
                        gRows.forEach(row => {
                            let valM = row[v.idxM]; let mObj = (typeof valM === 'object' && valM !== null) ? valM.M : valM;
                            tbodyHtml += `<td style="text-align:center; border:1px solid #ddd;">${mObj !== undefined && mObj !== "" ? mObj : "-"}</td>`;
                            if(!isNaN(parseFloat(mObj))) rowTotM += parseFloat(mObj);
                            if(isProgressive) {
                                let pObj = (typeof valM === 'object' && valM !== null) ? valM.P : valM;
                                tbodyHtml += `<td style="text-align:center; border:1px solid #ddd;">${pObj !== undefined && pObj !== "" ? pObj : "-"}</td>`;
                                if(!isNaN(parseFloat(pObj))) rowTotP += parseFloat(pObj);
                            }
                        });
                        tbodyHtml += `<td style="text-align:center; font-weight:bold; background:#e8f5e9; border:1px solid #ddd;">${rowTotM}</td>`;
                        if(isProgressive) { tbodyHtml += `<td style="text-align:center; font-weight:bold; background:#e8f5e9; border:1px solid #ddd;">${rowTotP}</td>`; }
                        tbodyHtml += `</tr>`;
                    });
                }
                html += `<div class="table-responsive"><table class="report-table" style="margin-top:0; border-top:none;"><thead>${theadHtml}</thead><tbody>${tbodyHtml}</tbody></table></div>`;
            } 
            else {
                let h1Arr = [], h2Arr = [], h3Arr = [];
                showIndices.forEach(idx => {
                    let parts = headers[idx].split(" - ");
                    h1Arr.push(parts[0] ? parts[0].trim() : "");
                    if(parts.length === 2) { h2Arr.push(parts[1].trim()); h3Arr.push(""); } 
                    else if(parts.length >= 3) { h2Arr.push(parts[1].trim()); h3Arr.push(parts.slice(2).join(" - ").trim()); } 
                    else { h2Arr.push(""); h3Arr.push(""); }
                });

                let maxDepth = 1;
                if(h2Arr.some(h => h !== "")) maxDepth = 2;
                if(h3Arr.some(h => h !== "")) maxDepth = 3;

                let tree = [];
                for(let c=0; c<h1Arr.length; c++) {
                    let h1 = h1Arr[c], h2 = h2Arr[c], h3 = h3Arr[c];
                    let last1 = tree.length > 0 ? tree[tree.length-1] : null;
                    if(last1 && last1.label === h1 && h1 !== "") {
                        let last2 = last1.children.length > 0 ? last1.children[last1.children.length-1] : null;
                        if(last2 && last2.label === h2 && h2 !== "") { last2.children.push({label: h3, colspan: 1}); last2.colspan++; } 
                        else { last1.children.push({label: h2, colspan: 1, children: h3 !== "" ? [{label: h3, colspan: 1}] : []}); }
                        last1.colspan++;
                    } else {
                        tree.push({label: h1, colspan: 1, children: h2 !== "" ? [{label: h2, colspan: 1, children: h3 !== "" ? [{label: h3, colspan: 1}] : []}] : []});
                    }
                }
                
                let r1Html = "<tr>", r2Html = "<tr>", r3Html = "<tr>";
                r1Html += `<th rowspan="${maxDepth}" style="background:#f4b400; color:#000; border:1px solid #ddd; vertical-align:middle; text-align:center; position:sticky; left:0; z-index:2;">अ.क्र.</th>`;
                if(isList) { r1Html += `<th rowspan="${maxDepth}" style="background:#f4b400; color:#000; border:1px solid #ddd; vertical-align:middle; text-align:center; position:sticky; left:45px; z-index:2;">उपकेंद्र</th>`; }
                r1Html += `<th rowspan="${maxDepth}" style="background:#f4b400; color:#000; border:1px solid #ddd; vertical-align:middle; text-align:center; position:sticky; left:${isList ? '120px' : '45px'}; z-index:2;">गाव</th>`;

                tree.forEach(n1 => {
                    let rs1 = n1.children.length === 0 ? maxDepth : 1;
                    r1Html += `<th colspan="${n1.colspan}" rowspan="${rs1}" style="background:#f4b400; color:#000; border:1px solid #ddd; text-align:center; padding:8px;">${n1.label}</th>`;
                    if (n1.children.length > 0) {
                        n1.children.forEach(n2 => {
                            let rs2 = n2.children.length === 0 ? (maxDepth - 1) : 1;
                            r2Html += `<th colspan="${n2.colspan}" rowspan="${rs2}" style="background:#ffe082; color:#000; border:1px solid #ddd; font-size:13px; text-align:center; padding:6px;">${n2.label}</th>`;
                            if(n2.children.length > 0) { n2.children.forEach(n3 => { r3Html += `<th style="background:#fff3e0; color:#000; border:1px solid #ddd; font-size:12px; text-align:center; padding:6px;">${n3.label}</th>`; }); }
                        });
                    }
                });
                r1Html += "</tr>"; r2Html += "</tr>"; r3Html += "</tr>";
                let theadHtml = r1Html; if(maxDepth >= 2) { theadHtml += r2Html; } if(maxDepth === 3) { theadHtml += r3Html; }
                
                html += `<div class="table-responsive"><table class="report-table" style="margin-top:0; border-top:none;"><thead>${theadHtml}</thead><tbody>`;

                if(gRows.length === 0) {
                    html += `<tr><td colspan="${showIndices.length+2}" style="color:red; font-weight:bold; font-size:16px;">निरंक (Nil)</td></tr>`;
                } else {
                    gRows.forEach((row, i) => {
                        html += `<tr><td class="sticky-col" style="background:#fdfdfd; left:0;">${i+1}</td>`;
                        if(isList) { html += `<td class="sticky-col" style="background:#fdfdfd; left:45px;">${subCenterIdx > -1 ? row[subCenterIdx] : "-"}</td>`; }
                        html += `<td class="sticky-col" style="background:#fdfdfd; left:${isList ? '120px' : '45px'};">${row[villageIdx] || "-"}</td>`;
                        showIndices.forEach(idx => { 
                            let cellVal = row[idx] !== undefined && row[idx] !== "" ? String(row[idx]) : "-";
                            if (/^\d{4}-\d{2}-\d{2}/.test(cellVal)) { let dParts = cellVal.split('T')[0].split('-'); cellVal = `${dParts[2]}-${dParts[1]}-${dParts[0]}`; }
                            html += `<td>${cellVal}</td>`; 
                        });
                        html += `</tr>`;
                    });

                    if(isStats && gRows.length > 0) {
                        let pseudoData = [headers].concat(gRows); let { totals, isNumericCol } = getTotalsRow(pseudoData, headers, showIndices);
                        html += `<tr style="background:#d4edda; font-weight:bold; color:#155724;"><td colspan="${isList ? 3 : 2}" class="sticky-col" style="background:#d4edda; left:0; text-align:center;">एकूण</td>`;
                        showIndices.forEach(idx => { if(isNumericCol[idx]) { html += `<td>${totals[idx]}</td>`; } else { html += `<td>-</td>`; } });
                        html += `</tr>`;
                    }
                }
                html += `</tbody></table></div>`;
            }
        });
        html += `</div>`;
    });
    container.innerHTML = html;
}

// 🟢 MODIFIED: downloadConsolidatedExcel with Security for Aggregation
function downloadConsolidatedExcel() {
    if(currentReports.length === 0) return;
    
    // 🟢 सुरक्षा अट: फक्त ॲडमिन/मॅनेजरलाच Grouping चा अधिकार
    let groupType = "Village";
    if (user.role === 'Admin' || user.role === 'MANAGER' || user.role === 'VIEWER') {
        groupType = document.getElementById('reportGroupFilter') ? document.getElementById('reportGroupFilter').value : "Village";
    }

    let wb = XLSX.utils.book_new();
    let month = document.getElementById('reportMonth').value;
    let year = document.getElementById('reportYear').value;
    let filterRole = document.getElementById('reportRoleFilter') ? document.getElementById('reportRoleFilter').value : "सर्व";
    
    let periodText = (month === 'सर्व' && year === 'सर्व') ? 'सर्व महिने' : `${month} ${year}`;
    if((user.role === 'Admin' || user.role === 'VIEWER' || user.role === 'MANAGER') && filterRole !== 'सर्व') periodText += ` (${filterRole})`;

    currentReports.forEach((rep, index) => {
        let headers = rep.data[0]; 
        let showIndices = []; 
        headers.forEach((h, i) => { if(!CONFIG.hiddenColumns.includes(h) && h !== "गाव" && h !== "Village") showIndices.push(i); });
        
        let subCenterIdx = headers.indexOf("उपकेंद्र"); 
        let villageIdx = headers.indexOf("गाव");
        let dataRows = rep.data.slice(1);
        const formObj = masterData.forms.find(x => x.FormName === rep.formName);
        const isList = formObj && String(formObj.FormType).trim().includes('List');

        // 🟢 उपकेंद्रनिहाय बेरीज करण्याचे लॉजिक (SubCenter Aggregation)
        if (groupType === "SubCenter" && !isList) {
            let aggregated = {};
            dataRows.forEach(row => {
                let sc = subCenterIdx > -1 ? String(row[subCenterIdx] || "").trim() : "Unknown";
                if (!aggregated[sc]) {
                    aggregated[sc] = Array(headers.length).fill(0);
                    headers.forEach((h, idx) => { if (!showIndices.includes(idx)) aggregated[sc][idx] = row[idx]; });
                }
                showIndices.forEach(idx => {
                    let val = row[idx];
                    if (typeof val === 'object' && val !== null) {
                        if (typeof aggregated[sc][idx] !== 'object') aggregated[sc][idx] = { M: 0, P: 0 };
                        aggregated[sc][idx].M += parseFloat(val.M || 0); 
                        aggregated[sc][idx].P += parseFloat(val.P || 0);
                    } else {
                        let n = parseFloat(val); 
                        if (!isNaN(n)) aggregated[sc][idx] = (parseFloat(aggregated[sc][idx]) || 0) + n;
                        else aggregated[sc][idx] = val;
                    }
                });
            });
            dataRows = Object.values(aggregated);
        }

        let sheetData = []; 
        let groupNameText = groupType === "SubCenter" ? "उपकेंद्रनिहाय बेरीज" : "गावनिहाय";
        sheetData.push([`${rep.formName} अहवाल (${groupNameText})`]); 
        
        // 🟢 एक्सेलमध्ये हेडर रो टाकणे (जर उपकेंद्रनिहाय असेल तर "गाव" च्या जागी "उपकेंद्र" दाखवणे)
        let modifiedHeaders = [...headers];
        if(groupType === "SubCenter" && villageIdx > -1) {
            modifiedHeaders[villageIdx] = "उपकेंद्र";
        }
        sheetData.push(modifiedHeaders);
        
        dataRows.forEach(r => {
            let cleanRow = r.map((v, cIdx) => {
                if(groupType === "SubCenter" && cIdx === villageIdx) return r[subCenterIdx]; // गावाच्या रकान्यात उपकेंद्राचे नाव टाकणे
                return (typeof v === 'object' && v !== null) ? `${v.M} (M) / ${v.P} (P)` : v;
            });
            sheetData.push(cleanRow);
        });

        // 🟢 एक्सेलची डिझाईन आणि स्टायलिंग (Styling)
        let ws = XLSX.utils.aoa_to_sheet(sheetData);
        let merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: showIndices.length + 1 } }];
        ws["!merges"] = merges;

        for(let R=0; R<sheetData.length; R++) {
            for(let C=0; C<modifiedHeaders.length; C++) { 
                let cellRef = XLSX.utils.encode_cell({r: R, c: C}); 
                if(!ws[cellRef]) continue;
                
                let cellStyle = { font: { name: "Arial", sz: 11, color: { rgb: "000000" } }, alignment: { vertical: "center", horizontal: "center", wrapText: true } };
                if(R === 0) { 
                    cellStyle.fill = { fgColor: { rgb: "00705A" } }; 
                    cellStyle.font = { name: "Arial", sz: 14, bold: true, color: { rgb: "FFFFFF" } }; 
                } else if(R === 1) { 
                    cellStyle.fill = { fgColor: { rgb: "F4B400" } }; 
                    cellStyle.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "000000" } }; 
                    cellStyle.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }; 
                } else { 
                    cellStyle.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }; 
                }
                ws[cellRef].s = cellStyle;
            }
        }

        let wscols = [{ wch: 10 }, { wch: 25 }]; 
        for(let c=2; c<modifiedHeaders.length; c++) wscols.push({ wch: 15 }); 
        ws["!cols"] = wscols;

        let safeSheetName = rep.formName.replace(/[\\\/\?\*\[\]\:]/g, "").substring(0, 31); 
        if(!safeSheetName) safeSheetName = "Sheet" + (index + 1);
        XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    });
    
    XLSX.writeFile(wb, `मासिक_अहवाल_${groupType}_${periodText}.xlsx`);
}}
