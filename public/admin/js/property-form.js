document.addEventListener('DOMContentLoaded', function () {
    const editId = new URLSearchParams(window.location.search).get('id');
    if (editId) {
        setTopbarTitle('Edit Property', 'Update the property listing details');
        loadProperty(editId);
    } else {
        setTopbarTitle('Add Property', 'Create a new property listing');
        renderForm();
    }
});

let selectedFiles = [];
let existingImages = [];
let removeImages = [];
let editId = new URLSearchParams(window.location.search).get('id');

function loadProperty(id) {
    const content = document.getElementById('contentArea');
    content.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading property...</p>
        </div>`;

    API.get('/api/properties/' + id)
        .then((p) => {
            renderForm(p);
        })
        .catch((err) => {
            content.innerHTML = `
                <div class="card"><div class="card-body" style="text-align:center; padding: 60px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: var(--warning); margin-bottom: 16px; display:block;"></i>
                    <h3 style="margin-bottom: 8px;">Failed to load property</h3>
                    <p style="color: var(--text-muted); margin-bottom: 20px;">${esc(err.message)}</p>
                    <a href="/admin/properties.html" class="btn btn-primary"><i class="fas fa-arrow-left"></i> Back to Properties</a>
                </div></div>`;
        });
}

function renderForm(p) {
    const content = document.getElementById('contentArea');
    const isEdit = !!p;
    existingImages = p ? p.images || [] : [];

    const khataOptions = ['', 'A Khata', 'B Khata', 'Commercial', 'Other'];
    const loanOptions = ['', 'Yes', 'No'];
    const availableOptions = ['', 'Buy', 'Sell', 'Lease', 'Rent'];

    content.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>${isEdit ? '<i class="fas fa-edit" style="margin-right: 8px; color: var(--primary);"></i> Edit Property' : '<i class="fas fa-plus-circle" style="margin-right: 8px; color: var(--primary);"></i> Add New Property'}</h3>
                <a href="/admin/properties.html" class="btn btn-outline btn-sm"><i class="fas fa-arrow-left"></i> Back</a>
            </div>
            <div class="card-body">
                <form id="propertyForm">
                    <div class="form-grid">
                        <div class="form-group full">
                            <label for="name">Property Name <span class="required">*</span></label>
                            <input type="text" id="name" name="name" required placeholder="e.g. Sai Residency, Green Villa, etc." value="${isEdit ? esc(p.name) : ''}">
                        </div>

                        <div class="form-group full">
                            <label for="size">Property Size <span class="required">*</span></label>
                            <input type="text" id="size" name="size" required placeholder="e.g. 2BHK, 3BHK, Independent House" value="${isEdit ? esc(p.size) : ''}">
                        </div>

                        <div class="form-group">
                            <label for="facing">Property Facing</label>
                            <select id="facing" name="facing">
                                ${['', 'East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'].map((f) =>
                                    `<option value="${f}" ${isEdit && p.facing === f ? 'selected' : ''}>${f || 'Select facing'}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="khata">Property Khata</label>
                            <select id="khata" name="khata">
                                ${khataOptions.map((k) =>
                                    `<option value="${k}" ${isEdit && p.khata === k ? 'selected' : ''}>${k || 'Select khata'}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="place">Place <span class="required">*</span></label>
                            <input type="text" id="place" name="place" required placeholder="e.g. BTM Layout, Bengaluru" value="${isEdit ? esc(p.place) : ''}">
                        </div>

                        <div class="form-group">
                            <label for="road">Road Width (feet)</label>
                            <input type="text" id="road" name="road" placeholder="e.g. 40 feet road" value="${isEdit ? esc(p.road) : ''}">
                        </div>

                        <div class="form-group">
                            <label for="loan">Existing Loan</label>
                            <select id="loan" name="loan">
                                ${loanOptions.map((l) =>
                                    `<option value="${l}" ${isEdit && p.loan === l ? 'selected' : ''}>${l || 'Select'}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="available">Available For</label>
                            <select id="available" name="available">
                                ${availableOptions.map((a) =>
                                    `<option value="${a}" ${isEdit && p.available === a ? 'selected' : ''}>${a || 'Select'}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="price">Price</label>
                            <input type="text" id="price" name="price" placeholder="e.g. ₹1.2 Cr or ₹85 Lakh" value="${isEdit ? esc(p.price) : ''}">
                        </div>

                        <div class="form-group">
                            <label for="status">Listing Status</label>
                            <select id="status" name="status">
                                ${['Available', 'Sold', 'Rented', 'Under Construction'].map((s) =>
                                    `<option value="${s}" ${isEdit && p.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group full">
                            <label for="description">Brief Explanation About the Property</label>
                            <textarea id="description" name="description" rows="5" placeholder="Describe the property, amenities, nearby facilities, condition, etc.">${isEdit ? esc(p.description) : ''}</textarea>
                        </div>

                        ${isEdit && existingImages.length ? `
                        <div class="form-group full">
                            <label>Existing Images</label>
                            <div class="image-previews" id="existingImagesPreview">
                                ${existingImages.map((img) => `
                                    <div class="image-preview">
                                        <img src="${img}" alt="">
                                        <button type="button" class="remove-img" onclick="removeExistingImage('${esc(img)}', this)"><i class="fas fa-times"></i></button>
                                    </div>`).join('')}
                            </div>
                        </div>` : ''}

                        <div class="form-group full">
                            <label>Property Images</label>
                            <div class="image-upload-area" onclick="document.getElementById('images').click()">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Click to upload images (up to 8, max 5MB each)</p>
                                <p style="font-size:0.75rem; color: var(--text-muted);">JPG, PNG, WEBP supported</p>
                                <input type="file" id="images" name="images" accept="image/*" multiple onchange="handleFiles(this.files)">
                            </div>
                            <div class="image-previews" id="newImagesPreview"></div>
                        </div>

                        <div class="form-group full">
                            <label class="toggle" style="margin-right: 10px;">
                                <input type="checkbox" id="featured" name="featured" ${isEdit && p.featured ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                            <span style="font-size: 0.9rem; font-weight: 500; color: var(--dark); vertical-align: middle;">Feature this property (shows first / highlighted)</span>
                        </div>
                    </div>

                    <div class="form-actions">
                        <a href="/admin/properties.html" class="btn btn-outline"><i class="fas fa-times"></i> Cancel</a>
                        <button type="submit" class="btn btn-primary" id="submitBtn">
                            ${isEdit ? '<i class="fas fa-save"></i> Save Changes' : '<i class="fas fa-plus"></i> Create Property'}
                        </button>
                    </div>
                </form>
            </div>
        </div>`;

    document.getElementById('propertyForm').addEventListener('submit', handleSubmit);
}

function handleFiles(files) {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    selectedFiles = [...selectedFiles, ...validFiles].slice(0, 8);
    renderNewImages();
}

function renderNewImages() {
    const preview = document.getElementById('newImagesPreview');
    if (!preview) return;
    preview.innerHTML = selectedFiles.map((f, i) => `
        <div class="image-preview">
            <img src="${URL.createObjectURL(f)}" alt="">
            <button type="button" class="remove-img" onclick="removeNewImage(${i})"><i class="fas fa-times"></i></button>
        </div>`).join('');
}

function removeNewImage(index) {
    selectedFiles.splice(index, 1);
    renderNewImages();
}

function removeExistingImage(img, btn) {
    btn.closest('.image-preview').remove();
    removeImages.push(img);
}

async function handleSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    const formData = new FormData();
    formData.append('name', document.getElementById('name').value.trim());
    formData.append('size', document.getElementById('size').value.trim());
    formData.append('facing', document.getElementById('facing').value);
    formData.append('khata', document.getElementById('khata').value);
    formData.append('place', document.getElementById('place').value.trim());
    formData.append('road', document.getElementById('road').value.trim());
    formData.append('loan', document.getElementById('loan').value);
    formData.append('available', document.getElementById('available').value);
    formData.append('price', document.getElementById('price').value.trim());
    formData.append('status', document.getElementById('status').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('featured', document.getElementById('featured').checked);

    selectedFiles.forEach((f) => formData.append('images', f));
    removeImages.forEach((img) => formData.append('removeImages', img));

    try {
        const isEdit = !!editId;
        if (isEdit) {
            await API.put('/api/properties/' + editId, formData);
            toast('Property updated successfully', 'success');
        } else {
            await API.post('/api/properties', formData);
            toast('Property created successfully', 'success');
        }
        setTimeout(() => (window.location.href = '/admin/properties.html'), 600);
    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        toast(err.message, 'error');
    }
}
