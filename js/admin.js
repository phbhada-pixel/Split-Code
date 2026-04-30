function addFieldToUI(fieldData = null) {
    const list = document.getElementById('fieldsList');
    const fDiv = document.createElement('div');
    fDiv.className = "field-builder";
    fDiv.style.border = "2px solid #17a2b8";
    fDiv.style.padding = "10px";
    fDiv.style.marginBottom = "15px";
    fDiv.style.borderRadius = "8px";
    fDiv.style.background = "#fff";

    let isReqChecked = (fieldData && fieldData.isRequired) ? "checked" : "";
    let selType = fieldData ? fieldData.type : 'number';

    fDiv.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center;">
            <button onclick="this.parentElement.parentElement.remove()" style="color:red; font-weight:bold; background:none; border:none; font-size:18px; cursor:pointer;" title="प्रश्न काढा">✖</button>
            <input type="text" class="f-label" placeholder="मुख्य प्रश्नाचे नाव (उदा. गरोदर माता)" value="${fieldData ? fieldData.label : ''}" style="flex:2; padding:8px; border:1px solid #ccc; border-radius:4px; font-weight:bold;">
            
            <select class="f-type" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;" 
                onchange="this.parentElement.parentElement.querySelector('.add-sub-btn').style.display = (this.value === 'group' ? 'block' : 'none'); if(this.value !== 'group') this.parentElement.parentElement.querySelector('.sub-fields').innerHTML='';">
                <option value="number" ${selType === 'number' ? 'selected' : ''}>Number (आकडे)</option>
                <option value="text" ${selType === 'text' ? 'selected' : ''}>Text (अक्षरे)</option>
                <option value="dropdown" ${selType === 'dropdown' ? 'selected' : ''}>Dropdown (यादी)</option>
                <option value="group" ${selType === 'group' ? 'selected' : ''}>Group (सब-प्रश्न गट)</option>
            </select>
        </div>
        <div style="margin-left: 30px; margin-top: 5px;">
            <label style="font-size:13px; color:#d35400; font-weight:bold;"><input type="checkbox" class="f-req" ${isReqChecked}> हा प्रश्न भरणे सक्तीचे (Required) आहे</label>
        </div>
        <div class="sub-fields" style="margin-left:20px; border-left:3px solid #17a2b8; padding-left:15px; margin-top:10px;"></div>
        
        <button type="button" class="add-sub-btn" onclick="addSubField(this.parentElement)" 
            style="display:${selType === 'group' ? 'block' : 'none'}; margin-left:20px; background:#e0f7fa; border:1px solid #00acc1; color:#00838f; font-weight:bold; padding:6px 12px; margin-top:8px; border-radius:4px; cursor:pointer;">
            ➕ सब-प्रश्न जोडा
        </button>
    `;
    list.appendChild(fDiv);

    if (fieldData && fieldData.type === 'group') {
        if(fieldData.subFields) {
            fieldData.subFields.forEach(sf => addSubFieldToUI(fDiv, sf));
        }
    }
}

function addSubFieldToUI(parentDiv, sfData = null) {
    const subList = parentDiv.querySelector('.sub-fields');
    const sDiv = document.createElement('div');
    sDiv.style.marginBottom = "10px";
    sDiv.style.padding = "8px";
    sDiv.style.background = "#f4f7f6";
    sDiv.style.border = "1px solid #ced4da";
    sDiv.style.borderRadius = "5px";

    let isReqChecked = (sfData && sfData.isRequired) ? "checked" : "";
    let selType = sfData ? sfData.type : 'number';

    sDiv.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center;">
            <button onclick="this.parentElement.parentElement.remove()" style="color:orange; font-weight:bold; background:none; border:none; font-size:16px; cursor:pointer;">✖</button>
            <input type="text" class="sf-label" placeholder="सब-प्रश्नाचे नाव (उदा. नोंदणी)" value="${sfData ? sfData.label : ''}" style="flex:2; padding:6px; border:1px solid #bbb; border-radius:4px;">
            
            <select class="sf-type" style="flex:1; padding:6px; border:1px solid #bbb; border-radius:4px;"
                onchange="this.parentElement.parentElement.querySelector('.add-sub-sub-btn').style.display = (this.value === 'group' ? 'block' : 'none'); if(this.value !== 'group') this.parentElement.parentElement.querySelector('.sub-sub-fields').innerHTML='';">
                <option value="number" ${selType === 'number' ? 'selected' : ''}>Number</option>
                <option value="text" ${selType === 'text' ? 'selected' : ''}>Text</option>
                <option value="dropdown" ${selType === 'dropdown' ? 'selected' : ''}>Dropdown</option>
                <option value="group" ${selType === 'group' ? 'selected' : ''}>Group (3rd Level)</option>
            </select>
        </div>
        <div style="margin-left: 25px; margin-top: 3px;">
            <label style="font-size:12px; color:#d35400;"><input type="checkbox" class="sf-req" ${isReqChecked}> आवश्यक आहे (*)</label>
        </div>
        <div class="sub-sub-fields" style="margin-left:20px; border-left:2px dotted #ff9800; padding-left:10px; margin-top:5px;"></div>
        
        <button type="button" class="add-sub-sub-btn" onclick="addSubSubField(this.parentElement)" 
            style="display:${selType === 'group' ? 'block' : 'none'}; margin-left:20px; background:#fff3e0; border:1px solid #ffb74d; color:#e65100; font-size:11px; padding:4px 8px; margin-top:5px; cursor:pointer; border-radius:4px;">
            ➕ तिसरी लेव्हल (Sub-Sub) जोडा
        </button>
    `;
    subList.appendChild(sDiv);

    if (sfData && sfData.type === 'group') {
        if(sfData.subFields) {
            sfData.subFields.forEach(ssf => addSubSubFieldToUI(sDiv, ssf));
        }
    }
}

function addSubSubFieldToUI(parentDiv, ssfData = null) {
    const subSubList = parentDiv.querySelector('.sub-sub-fields');
    const ssDiv = document.createElement('div');
    ssDiv.style.marginBottom = "5px";
    
    let isReqChecked = (ssfData && ssfData.isRequired) ? "checked" : "";
    let selType = ssfData ? ssfData.type : 'number';

    ssDiv.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center;">
            <button onclick="this.parentElement.parentElement.remove()" style="color:#d32f2f; font-weight:bold; background:none; border:none; font-size:14px; cursor:pointer;">✖</button>
            <input type="text" class="ssf-label" placeholder="तिसऱ्या लेव्हलचे नाव (उदा. १२ आठवड्यांच्या आत)" value="${ssfData ? ssfData.label : ''}" style="flex:2; padding:4px; border:1px solid #aaa; border-radius:4px;">
            <select class="ssf-type" style="flex:1; padding:4px; border:1px solid #aaa; border-radius:4px;">
                <option value="number" ${selType === 'number' ? 'selected' : ''}>Number</option>
                <option value="text" ${selType === 'text' ? 'selected' : ''}>Text</option>
                <option value="dropdown" ${selType === 'dropdown' ? 'selected' : ''}>Dropdown</option>
            </select>
        </div>
        <div style="margin-left: 20px; margin-top: 3px;">
            <label style="font-size:11px; color:#d35400;"><input type="checkbox" class="ssf-req" ${isReqChecked}> आवश्यक आहे (*)</label>
        </div>
    `;
    subSubList.appendChild(ssDiv);
}

function addField() { addFieldToUI(); }
function addSubField(parentDiv) { addSubFieldToUI(parentDiv); }
function addSubSubField(parentDiv) { addSubSubFieldToUI(parentDiv); }

// 🟢 फॉर्म सेव्ह करण्याचे अपडेटेड फंक्शन (३ लेव्हल पर्यंत सपोर्ट)
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
        if(l) {
            let fieldObj = { label: l, type: t, isRequired: r };
            if(t === 'group') {
                fieldObj.subFields = [];
                fDiv.querySelectorAll('.sub-fields > div').forEach(sDiv => {
                    let sl = sDiv.querySelector('.sf-label').value;
                    let st = sDiv.querySelector('.sf-type').value;
                    let sr = sDiv.querySelector('.sf-req').checked;
                    if(sl) {
                        let subFieldObj = { label: sl, type: st, isRequired: sr };
                        if(st === 'group') {
                            subFieldObj.subFields = [];
                            sDiv.querySelectorAll('.sub-sub-fields > div').forEach(ssDiv => {
                                let ssl = ssDiv.querySelector('.ssf-label').value;
                                let sst = ssDiv.querySelector('.ssf-type').value;
                                let ssr = ssDiv.querySelector('.ssf-req').checked;
                                if(ssl) subFieldObj.subFields.push({ label: ssl, type: sst, isRequired: ssr });
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
        // GAS (Google Apps Script) ला डेटा पाठवणे
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
            await fetchData(); // मास्टर डेटा रिफ्रेश करा
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
