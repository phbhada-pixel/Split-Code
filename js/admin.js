// 🟢 JS/ADMIN.JS - Advanced Logic Added (Google Apps Script)

let adminFieldCounter = 1; // प्रश्नांना ID देण्यासाठी काउंटर

function openNewFormBuilder() {
    adminFieldCounter = 1;
    document.getElementById('formBuilder').classList.remove('hidden');
    document.getElementById('builderTitle').innerText = "नवीन फॉर्म तयार करा";
    document.getElementById('editFormID').value = "";
    document.getElementById('newFormName').value = "";
    document.getElementById('newFormType').value = "Stats";
    document.getElementById('newFormLayout').value = "Horizontal";
    document.getElementById('formIsActive').checked = true;
    document.getElementById('roleAll').checked = true;
    document.getElementById('specificRoles').style.display = "none";
    document.querySelectorAll('.form-role').forEach(cb => cb.checked = false);
    document.getElementById('fieldsList').innerHTML = "";
    document.getElementById('mainActionBtn').innerText = "फॉर्म सेव्ह करा";
    toggleLayoutOption();
    addField(); 
}

function toggleLayoutOption() {
    const type = document.getElementById('newFormType').value;
    const layoutDiv = document.getElementById('layoutDiv');
    if(type === 'ProgressiveStats') { layoutDiv.style.display = "block"; } 
    else { layoutDiv.style.display = "none"; }
}

function toggleRoles(checkbox) {
    const rolesDiv = document.getElementById('specificRoles');
    if (checkbox.checked) { rolesDiv.style.display = "none"; } 
    else { rolesDiv.style.display = "block"; }
}

function renderFormsListForEdit() {
    const area = document.getElementById('formsEditList');
    if(!area) return;
    area.innerHTML = "";
    if(!masterData || !masterData.forms) return;
    masterData.forms.forEach(f => {
        let btn = document.createElement('button');
        btn.innerText = `✏️ ${f.FormName} ${isFormInactive(f) ? '(Inactive)' : ''}`;
        btn.className = "btn-edit-tab";
        btn.style.margin = "5px";
        btn.onclick = () => loadFormForEdit(f);
        area.appendChild(btn);
    });
}

function updateCounterFromStructure(arr) {
    arr.forEach(item => {
        if(item.fid && item.fid.startsWith('f_')) {
            let num = parseInt(item.fid.replace('f_', ''));
            if(!isNaN(num) && num >= adminFieldCounter) { adminFieldCounter = num + 1; }
        }
        if(item.subFields) updateCounterFromStructure(item.subFields);
    });
}

function loadFormForEdit(f) {
    adminFieldCounter = 1;
    document.getElementById('formBuilder').classList.remove('hidden');
    document.getElementById('builderTitle').innerText = "फॉर्म एडिट करा: " + f.FormName;
    document.getElementById('editFormID').value = f.FormID;
    document.getElementById('newFormName').value = f.FormName;
    
    let typeStr = String(f.FormType).trim();
    if(typeStr.includes('Vertical')) { document.getElementById('newFormType').value = "ProgressiveStats"; document.getElementById('newFormLayout').value = "Vertical"; } 
    else if(typeStr.includes('ProgressiveStats')) { document.getElementById('newFormType').value = "ProgressiveStats"; document.getElementById('newFormLayout').value = "Horizontal"; } 
    else if(typeStr.includes('List')) { document.getElementById('newFormType').value = "List"; document.getElementById('newFormLayout').value = "Horizontal"; } 
    else { document.getElementById('newFormType').value = "Stats"; document.getElementById('newFormLayout').value = "Horizontal"; }
    
    toggleLayoutOption();

    if (f.IsActive !== undefined) { document.getElementById('formIsActive').checked = f.IsActive; } 
    else { document.getElementById('formIsActive').checked = true; }

    let roles = f.AllowedRoles ? f.AllowedRoles.split(',').map(r=>r.trim().toUpperCase()) : ["ALL"];
    if (roles.includes("ALL")) {
        document.getElementById('roleAll').checked = true;
        document.getElementById('specificRoles').style.display = "none";
        document.querySelectorAll('.form-role').forEach(cb => cb.checked = false);
    } else {
        document.getElementById('roleAll').checked = false;
        document.getElementById('specificRoles').style.display = "block";
        document.querySelectorAll('.form-role').forEach(cb => { cb.checked = roles.includes(cb.value.toUpperCase()); });
    }

    document.getElementById('fieldsList').innerHTML = "";
    document.getElementById('mainActionBtn').innerText = "बदल सेव्ह करा (Update)";

    let structure = [];
    try { 
        structure = JSON.parse(f.StructureJSON); 
        updateCounterFromStructure(structure); // जुन्या ID च्या पुढे काउंटर नेणे
    } catch(e) {}
    
    if(structure.length === 0) { addField(); } 
    else { structure.forEach(field => addFieldToUI(field)); }
}

function addFieldToUI(fieldData = null) {
    const list = document.getElementById('fieldsList');
    const fDiv = document.createElement('div');
    fDiv.className = "field-builder";
    fDiv.style.border = "2px solid #17a2b8";
    fDiv.style.padding = "15px";
    fDiv.style.marginBottom = "15px";
    fDiv.style.borderRadius = "8px";
    fDiv.style.background = "#fff";

    let fid = fieldData && fieldData.fid ? fieldData.fid : 'f_' + (adminFieldCounter++);
    let isReqChecked = (fieldData && fieldData.isRequired) ? "checked" : "";
    let selType = fieldData ? fieldData.type : 'number';

    fDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #eee; padding-bottom:8px; margin-bottom:12px;">
            <label style="font-weight:bold; color:#17a2b8; font-size:16px;">मुख्य प्रश्न</label>
            <button onclick="this.parentElement.parentElement.remove()" style="color:white; background:#dc3545; border:none; padding:4px 8px; border-radius:4px; font-weight:bold; cursor:pointer;" title="प्रश्न काढा">✖ काढून टाका</button>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:10px;">
            <input type="text" class="f-label" placeholder="प्रश्नाचे नाव (उदा. गरोदर माता)" value="${fieldData ? fieldData.label : ''}" style="padding:10px; border:1px solid #ccc; border-radius:4px; font-weight:bold; width:100%; box-sizing:border-box;">
            
            <select class="f-type" style="padding:10px; border:1px solid #ccc; border-radius:4px; width:100%; box-sizing:border-box;" 
                onchange="this.parentElement.parentElement.querySelector('.add-sub-btn').style.display = (this.value === 'group' ? 'block' : 'none'); if(this.value !== 'group') this.parentElement.parentElement.querySelector('.sub-fields').innerHTML='';">
                <option value="number" ${selType === 'number' ? 'selected' : ''}>Number (आकडे)</option>
                <option value="text" ${selType === 'text' ? 'selected' : ''}>Text (अक्षरे)</option>
                <option value="dropdown" ${selType === 'dropdown' ? 'selected' : ''}>Dropdown (यादी)</option>
                <option value="group" ${selType === 'group' ? 'selected' : ''}>Group (सब-प्रश्न गट)</option>
            </select>

            <label style="font-size:14px; color:#d35400; font-weight:bold; margin-top:5px;">
                <input type="checkbox" class="f-req" ${isReqChecked} style="transform: scale(1.2); margin-right:8px;"> हा प्रश्न भरणे सक्तीचे (Required) आहे
            </label>
        </div>

        <!-- ⚙️ Advanced Logic Section -->
        <button type="button" onclick="let d = this.nextElementSibling; d.style.display = d.style.display==='none' ? 'flex' : 'none';" style="background:none; border:none; color:#0056b3; font-weight:bold; cursor:pointer; font-size:14px; padding:0; margin-top:12px; text-align:left;">⚙️ प्रगत सेटिंग्ज (Formulas, Formatting, Ranges)</button>
        <div class="advanced-settings" style="display:none; background:#f8f9fa; padding:12px; border:1px solid #ced4da; border-radius:4px; margin-top:8px; flex-direction:column; gap:8px;">
            <div style="font-size:14px; font-weight:bold; color:#d32f2f;">Field ID: <span style="background:#ffc107; padding:2px 8px; border-radius:4px; color:#000;">${fid}</span> <span style="font-size:12px; color:#555;">(सूत्रांमध्ये हे नाव वापरा)</span></div>
            <input type="hidden" class="f-id" value="${fid}">
            <input type="text" class="f-formula" placeholder="गणितीय सूत्र (उदा. f_1 + f_2 / f_3)" value="${fieldData && fieldData.formula ? fieldData.formula : ''}" style="padding:8px; border:1px solid #aaa; border-radius:4px; font-family:monospace;">
            <input type="text" class="f-dependency" placeholder="कंडिशनल फॉरमॅटिंग (उदा. f_1>10:'खतरा'[red])" value="${fieldData && fieldData.dependency ? fieldData.dependency : ''}" style="padding:8px; border:1px solid #aaa; border-radius:4px; font-family:monospace;">
            <input type="text" class="f-range" placeholder="व्हॅलिडेशन रेंज (उदा. 0-100)" value="${fieldData && fieldData.range ? fieldData.range : ''}" style="padding:8px; border:1px solid #aaa; border-radius:4px;">
        </div>

        <div class="sub-fields" style="margin-left:10px; border-left:3px solid #17a2b8; padding-left:10px; margin-top:15px;"></div>
        
        <button type="button" class="add-sub-btn" onclick="addSubField(this.parentElement)" 
            style="display:${selType === 'group' ? 'block' : 'none'}; width:100%; background:#e0f7fa; border:1px solid #00acc1; color:#00838f; font-weight:bold; padding:10px; margin-top:12px; border-radius:4px; cursor:pointer;">
            ➕ या गटात सब-प्रश्न जोडा
        </button>
    `;
    list.appendChild(fDiv);

    if (fieldData && fieldData.type === 'group') {
        if(fieldData.subFields) { fieldData.subFields.forEach(sf => addSubFieldToUI(fDiv, sf)); }
    }
}

function addSubFieldToUI(parentDiv, sfData = null) {
    const subList = parentDiv.querySelector('.sub-fields');
    const sDiv = document.createElement('div');
    sDiv.style.marginBottom = "15px";
    sDiv.style.padding = "10px";
    sDiv.style.background = "#f4f7f6";
    sDiv.style.border = "1px solid #ced4da";
    sDiv.style.borderRadius = "5px";

    let sfid = sfData && sfData.fid ? sfData.fid : 'f_' + (adminFieldCounter++);
    let isReqChecked = (sfData && sfData.isRequired) ? "checked" : "";
    let selType = sfData ? sfData.type : 'number';

    sDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding-bottom:5px; margin-bottom:10px;">
            <label style="font-weight:bold; color:#0056b3; font-size:14px;">सब-प्रश्न</label>
            <button onclick="this.parentElement.parentElement.remove()" style="color:#d32f2f; background:none; border:none; font-weight:bold; cursor:pointer;">✖ काढा</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
            <input type="text" class="sf-label" placeholder="सब-प्रश्नाचे नाव (उदा. नोंदणी)" value="${sfData ? sfData.label : ''}" style="padding:8px; border:1px solid #bbb; border-radius:4px; width:100%; box-sizing:border-box;">
            <select class="sf-type" style="padding:8px; border:1px solid #bbb; border-radius:4px; width:100%; box-sizing:border-box;"
                onchange="this.parentElement.parentElement.querySelector('.add-sub-sub-btn').style.display = (this.value === 'group' ? 'block' : 'none'); if(this.value !== 'group') this.parentElement.parentElement.querySelector('.sub-sub-fields').innerHTML='';">
                <option value="number" ${selType === 'number' ? 'selected' : ''}>Number (आकडे)</option>
                <option value="text" ${selType === 'text' ? 'selected' : ''}>Text (अक्षरे)</option>
                <option value="dropdown" ${selType === 'dropdown' ? 'selected' : ''}>Dropdown (यादी)</option>
                <option value="group" ${selType === 'group' ? 'selected' : ''}>Group (3rd Level)</option>
            </select>
            <label style="font-size:13px; color:#d35400; margin-top:3px;"><input type="checkbox" class="sf-req" ${isReqChecked}> आवश्यक आहे (*)</label>
        </div>

        <!-- ⚙️ Advanced Logic Section -->
        <button type="button" onclick="let d = this.nextElementSibling; d.style.display = d.style.display==='none' ? 'flex' : 'none';" style="background:none; border:none; color:#0056b3; font-weight:bold; cursor:pointer; font-size:13px; padding:0; margin-top:8px; text-align:left;">⚙️ प्रगत सेटिंग्ज (Formulas)</button>
        <div class="advanced-settings" style="display:none; background:#fff; padding:10px; border:1px dashed #ccc; border-radius:4px; margin-top:8px; flex-direction:column; gap:6px;">
            <div style="font-size:12px; font-weight:bold; color:#0056b3;">Field ID: <span style="background:#ffeb3b; padding:2px 6px; border-radius:3px; color:#000;">${sfid}</span></div>
            <input type="hidden" class="sf-id" value="${sfid}">
            <input type="text" class="sf-formula" placeholder="सूत्र (उदा. f_1 + f_2)" value="${sfData && sfData.formula ? sfData.formula : ''}" style="padding:6px; border:1px solid #aaa; border-radius:4px; font-family:monospace;">
            <input type="text" class="sf-dependency" placeholder="कंडिशनल (उदा. f_1>0:'Yes'[green])" value="${sfData && sfData.dependency ? sfData.dependency : ''}" style="padding:6px; border:1px solid #aaa; border-radius:4px; font-family:monospace;">
            <input type="text" class="sf-range" placeholder="रेंज (उदा. 0-100)" value="${sfData && sfData.range ? sfData.range : ''}" style="padding:6px; border:1px solid #aaa; border-radius:4px;">
        </div>

        <div class="sub-sub-fields" style="margin-left:10px; border-left:2px dotted #ff9800; padding-left:10px; margin-top:10px;"></div>
        
        <button type="button" class="add-sub-sub-btn" onclick="addSubSubField(this.parentElement)" 
            style="display:${selType === 'group' ? 'block' : 'none'}; width:100%; background:#fff3e0; border:1px solid #ffb74d; color:#e65100; font-size:13px; font-weight:bold; padding:8px; margin-top:10px; cursor:pointer; border-radius:4px;">
            ➕ तिसरी लेव्हल जोडा
        </button>
    `;
    subList.appendChild(sDiv);

    if (sfData && sfData.type === 'group') {
        if(sfData.subFields) { sfData.subFields.forEach(ssf => addSubSubFieldToUI(sDiv, ssf)); }
    }
}

function addSubSubFieldToUI(parentDiv, ssfData = null) {
    const subSubList = parentDiv.querySelector('.sub-sub-fields');
    const ssDiv = document.createElement('div');
    ssDiv.style.marginBottom = "10px";
    ssDiv.style.padding = "8px";
    ssDiv.style.background = "#fff";
    ssDiv.style.border = "1px solid #eee";
    ssDiv.style.borderRadius = "4px";
    
    let ssfid = ssfData && ssfData.fid ? ssfData.fid : 'f_' + (adminFieldCounter++);
    let isReqChecked = (ssfData && ssfData.isRequired) ? "checked" : "";
    let selType = ssfData ? ssfData.type : 'number';

    ssDiv.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <input type="text" class="ssf-label" placeholder="तिसरी लेव्हल (उदा. १२ आठवडे)" value="${ssfData ? ssfData.label : ''}" style="flex:1; padding:6px; border:1px solid #aaa; border-radius:4px; font-size:13px;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="color:#d32f2f; background:none; border:none; font-weight:bold; font-size:16px; margin-left:10px; cursor:pointer;">✖</button>
            </div>
            <select class="ssf-type" style="padding:6px; border:1px solid #aaa; border-radius:4px; font-size:13px; width:100%; box-sizing:border-box;">
                <option value="number" ${selType === 'number' ? 'selected' : ''}>Number (आकडे)</option>
                <option value="text" ${selType === 'text' ? 'selected' : ''}>Text (अक्षरे)</option>
                <option value="dropdown" ${selType === 'dropdown' ? 'selected' : ''}>Dropdown (यादी)</option>
            </select>
            <label style="font-size:12px; color:#d35400;"><input type="checkbox" class="ssf-req" ${isReqChecked}> सक्तीचे (*)</label>
            
            <button type="button" onclick="let d = this.nextElementSibling; d.style.display = d.style.display==='none' ? 'flex' : 'none';" style="background:none; border:none; color:#0056b3; font-weight:bold; cursor:pointer; font-size:11px; padding:0; margin-top:2px; text-align:left;">⚙️ प्रगत सेटिंग्ज</button>
            <div class="advanced-settings" style="display:none; background:#fafafa; padding:6px; border:1px solid #ddd; border-radius:4px; flex-direction:column; gap:4px;">
                <div style="font-size:11px; font-weight:bold;">ID: <span style="background:#ffeb3b; padding:1px 4px; border-radius:2px;">${ssfid}</span></div>
                <input type="hidden" class="ssf-id" value="${ssfid}">
                <input type="text" class="ssf-formula" placeholder="सूत्र (उदा. f_1 + f_2)" value="${ssfData && ssfData.formula ? ssfData.formula : ''}" style="padding:4px; border:1px solid #aaa; font-size:11px;">
                <input type="text" class="ssf-dependency" placeholder="कंडिशनल" value="${ssfData && ssfData.dependency ? ssfData.dependency : ''}" style="padding:4px; border:1px solid #aaa; font-size:11px;">
                <input type="text" class="ssf-range" placeholder="रेंज (उदा. 0-100)" value="${ssfData && ssfData.range ? ssfData.range : ''}" style="padding:4px; border:1px solid #aaa; font-size:11px;">
            </div>
        </div>
    `;
    subSubList.appendChild(ssDiv);
}

function addField() { addFieldToUI(); }
function addSubField(parentDiv) { addSubFieldToUI(parentDiv); }
function addSubSubField(parentDiv) { addSubSubFieldToUI(parentDiv); }

async function saveFullForm() {
    let fId = document.getElementById('editFormID').value;
    let fName = document.getElementById('newFormName').value;
    let baseType = document.getElementById('newFormType').value;
    let layout = document.getElementById('newFormLayout').value;
    let isActive = document.getElementById('formIsActive').checked;
    
    let isAllRoles = document.getElementById('roleAll').checked;
    let allowedRoles = "ALL";
    if (!isAllRoles) {
        let checkedRoles = [];
        document.querySelectorAll('.form-role').forEach(cb => { if(cb.checked) checkedRoles.push(cb.value); });
        if(checkedRoles.length > 0) allowedRoles = checkedRoles.join(',');
    }

    let finalType = baseType;
    if(baseType === 'ProgressiveStats' && layout === 'Vertical') finalType = 'ProgressiveStats_Vertical';

    if(!fName) { alert("फॉर्मचे नाव आवश्यक आहे!"); return; }

    let structure = [];
    document.querySelectorAll('.field-builder').forEach(fDiv => {
        let l = fDiv.querySelector('.f-label').value;
        let t = fDiv.querySelector('.f-type').value;
        let r = fDiv.querySelector('.f-req').checked;
        
        // Advanced Logic Extraction
        let fid = fDiv.querySelector('.f-id').value;
        let frm = fDiv.querySelector('.f-formula').value;
        let dep = fDiv.querySelector('.f-dependency').value;
        let rng = fDiv.querySelector('.f-range').value;

        if(l) {
            let fieldObj = { label: l, type: t, isRequired: r, fid: fid };
            if(frm) fieldObj.formula = frm;
            if(dep) fieldObj.dependency = dep;
            if(rng) fieldObj.range = rng;

            if(t === 'group') {
                fieldObj.subFields = [];
                fDiv.querySelectorAll('.sub-fields > div').forEach(sDiv => {
                    let sl = sDiv.querySelector('.sf-label').value;
                    let st = sDiv.querySelector('.sf-type').value;
                    let sr = sDiv.querySelector('.sf-req').checked;
                    
                    let sfid = sDiv.querySelector('.sf-id').value;
                    let sfrm = sDiv.querySelector('.sf-formula').value;
                    let sdep = sDiv.querySelector('.sf-dependency').value;
                    let srng = sDiv.querySelector('.sf-range').value;

                    if(sl) {
                        let subFieldObj = { label: sl, type: st, isRequired: sr, fid: sfid };
                        if(sfrm) subFieldObj.formula = sfrm;
                        if(sdep) subFieldObj.dependency = sdep;
                        if(srng) subFieldObj.range = srng;

                        if(st === 'group') {
                            subFieldObj.subFields = [];
                            sDiv.querySelectorAll('.sub-sub-fields > div').forEach(ssDiv => {
                                let ssl = ssDiv.querySelector('.ssf-label').value;
                                let sst = ssDiv.querySelector('.ssf-type').value;
                                let ssr = ssDiv.querySelector('.ssf-req').checked;

                                let ssfid = ssDiv.querySelector('.ssf-id').value;
                                let ssfrm = ssDiv.querySelector('.ssf-formula').value;
                                let ssdep = ssDiv.querySelector('.ssf-dependency').value;
                                let ssrng = ssDiv.querySelector('.ssf-range').value;

                                if(ssl) {
                                    let ssFieldObj = { label: ssl, type: sst, isRequired: ssr, fid: ssfid };
                                    if(ssfrm) ssFieldObj.formula = ssfrm;
                                    if(ssdep) ssFieldObj.dependency = ssdep;
                                    if(ssrng) ssFieldObj.range = ssrng;
                                    subFieldObj.subFields.push(ssFieldObj);
                                }
                            });
                        }
                        fieldObj.subFields.push(subFieldObj);
                    }
                });
            }
            structure.push(fieldObj);
        }
    });

    if(structure.length === 0) { alert("कमीत कमी १ प्रश्न आवश्यक आहे!"); return; }

    let formPayload = {
        FormID: fId ? fId : "F_" + Date.now(),
        FormName: fName,
        FormType: finalType,
        AllowedRoles: allowedRoles,
        StructureJSON: JSON.stringify(structure),
        IsActive: isActive
    };

    document.getElementById('mainActionBtn').innerText = "सेव्ह करत आहे...";
    document.getElementById('mainActionBtn').disabled = true;

    try {
        const r = await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify({ action: "saveForm", payload: formPayload })
        });
        const textResponse = await r.text();
        if(textResponse.trim().startsWith("<")) throw new Error("Google Blocked Request");
        
        const d = JSON.parse(textResponse);
        if(d.success) {
            alert("✅ फॉर्म यशस्वीरित्या सेव्ह झाला!");
            document.getElementById('formBuilder').classList.add('hidden');
            await fetchData(); 
        } else {
            alert("⚠️ एरर: " + d.message);
        }
    } catch (error) {
        console.error("Form Save Error:", error);
        alert("एरर: फॉर्म सेव्ह होऊ शकला नाही.");
    } finally {
        document.getElementById('mainActionBtn').innerText = "फॉर्म सेव्ह करा";
        document.getElementById('mainActionBtn').disabled = false;
    }
}
