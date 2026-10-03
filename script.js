const PUSKESMAS_LAT = -6.886424026235886;
const PUSKESMAS_LNG = 113.66322896318917;
const MAX_RADIUS_METERS = 50;
const STORAGE_KEY = 'puskesmas_pasongsongan_survei';

window.addEventListener('DOMContentLoaded', () => {
    checkUserLocation();
});

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

function checkUserLocation() {
    const statusBadge = document.getElementById('locationStatusBadge');
    const statusText = document.getElementById('locationText');
    const radiusWarning = document.getElementById('radiusWarning');
    const surveyButtons = document.getElementById('surveyButtonsContainer');

    statusText.innerText = "Mendeteksi lokasi GPS...";
    statusBadge.className = "text-xs bg-amber-100 text-amber-800 font-semibold px-3 py-1.5 rounded-full flex items-center space-x-1.5";

    if (!navigator.geolocation) {
        statusText.innerText = "GPS tidak didukung browser";
        statusBadge.className = "text-xs bg-rose-100 text-rose-800 font-semibold px-3 py-1.5 rounded-full flex items-center space-x-1.5";
        radiusWarning.classList.remove('hidden');
        document.getElementById('distanceInfo').innerText = "Browser perangkat Anda tidak mendukung fitur deteksi lokasi.";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const distance = calculateDistance(userLat, userLng, PUSKESMAS_LAT, PUSKESMAS_LNG);

            if (distance <= MAX_RADIUS_METERS) {
                statusText.innerText = `Dalam Area (${Math.round(distance)}m)`;
                statusBadge.className = "text-xs bg-emerald-100 text-emerald-800 font-semibold px-3 py-1.5 rounded-full flex items-center space-x-1.5";
                radiusWarning.classList.add('hidden');
                surveyButtons.classList.remove('opacity-50', 'pointer-events-none');
            } else {
                statusText.innerText = `Di Luar Area (${Math.round(distance)}m)`;
                statusBadge.className = "text-xs bg-rose-100 text-rose-800 font-semibold px-3 py-1.5 rounded-full flex items-center space-x-1.5";
                radiusWarning.classList.remove('hidden');
                document.getElementById('distanceInfo').innerText = `Posisi Anda berjarak sekitar ${Math.round(distance)} meter dari Puskesmas. Anda harus berada di bawah ${MAX_RADIUS_METERS} meter untuk mengisi survei.`;
                surveyButtons.classList.add('opacity-50', 'pointer-events-none');
            }
        },
        (error) => {
            statusText.innerText = "Gagal deteksi GPS";
            statusBadge.className = "text-xs bg-rose-100 text-rose-800 font-semibold px-3 py-1.5 rounded-full flex items-center space-x-1.5";
            radiusWarning.classList.remove('hidden');
            document.getElementById('distanceInfo').innerText = "Mohon berikan izin akses lokasi (GPS) pada perangkat Anda.";
            surveyButtons.classList.add('opacity-50', 'pointer-events-none');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function getSurveys() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveSurveys(surveys) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(surveys));
}

function submitPuas() {
    const surveys = getSurveys();
    const newRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        rating: 'PUAS',
        poli: '-',
        saran: '-'
    };
    surveys.unshift(newRecord);
    saveSurveys(surveys);
    showThankYou();
}

function openTidakPuasModal() {
    document.getElementById('formTidakPuas').reset();
    document.getElementById('customPoliContainer').classList.add('hidden');
    document.getElementById('tidakPuasModal').classList.remove('hidden');
}

function closeTidakPuasModal() {
    document.getElementById('tidakPuasModal').classList.add('hidden');
}

function toggleCustomPoli() {
    const select = document.getElementById('poliSelect');
    const customContainer = document.getElementById('customPoliContainer');
    const customInput = document.getElementById('customPoliInput');
    if (select.value === 'Lain-lain') {
        customContainer.classList.remove('hidden');
        customInput.required = true;
    } else {
        customContainer.classList.add('hidden');
        customInput.required = false;
        customInput.value = '';
    }
}

function submitTidakPuas(e) {
    e.preventDefault();
    const selectVal = document.getElementById('poliSelect').value;
    let poliName = selectVal;
    if (selectVal === 'Lain-lain') {
        poliName = document.getElementById('customPoliInput').value.trim();
    }
    const saran = document.getElementById('saranInput').value.trim() || '-';

    const surveys = getSurveys();
    const newRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        rating: 'TIDAK PUAS',
        poli: poliName,
        saran: saran
    };
    surveys.unshift(newRecord);
    saveSurveys(surveys);

    closeTidakPuasModal();
    showThankYou();
}

function showThankYou() {
    document.getElementById('thankYouModal').classList.remove('hidden');
}

function closeThankYou() {
    document.getElementById('thankYouModal').classList.add('hidden');
    checkUserLocation();
}

let tapCount = 0;
let tapTimer = null;
document.getElementById('secretTrigger').addEventListener('click', () => {
    tapCount++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => {
        tapCount = 0;
    }, 1000);

    if (tapCount >= 7) {
        tapCount = 0;
        openPinModal();
    }
});

function openPinModal() {
    document.getElementById('pinInput').value = '';
    document.getElementById('pinModal').classList.remove('hidden');
}

function closePinModal() {
    document.getElementById('pinModal').classList.add('hidden');
}

function verifyPin() {
    const pin = document.getElementById('pinInput').value;
    if (pin === '1234') {
        closePinModal();
        showAdminDashboard();
    } else {
        alert('PIN Salah! Silakan coba lagi.');
        document.getElementById('pinInput').value = '';
    }
}

let satisfactionChartInstance = null;
let poliChartInstance = null;

function showAdminDashboard() {
    document.getElementById('mainView').classList.add('hidden');
    document.getElementById('adminView').classList.remove('hidden');
    updateDashboardStats();
    renderTable();
}

function logoutAdmin() {
    document.getElementById('adminView').classList.add('hidden');
    document.getElementById('mainView').classList.remove('hidden');
    checkUserLocation();
}

function updateDashboardStats() {
    const surveys = getSurveys();
    const total = surveys.length;
    const puas = surveys.filter(s => s.rating === 'PUAS').length;
    const tidakPuas = surveys.filter(s => s.rating === 'TIDAK PUAS').length;

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statPuas').innerText = puas;
    document.getElementById('statTidakPuas').innerText = tidakPuas;

    const ctxSat = document.getElementById('satisfactionChart').getContext('2d');
    if (satisfactionChartInstance) satisfactionChartInstance.destroy();
    satisfactionChartInstance = new Chart(ctxSat, {
        type: 'doughnut',
        data: {
            labels: ['Puas', 'Tidak Puas'],
            datasets: [{
                data: [puas, tidakPuas],
                backgroundColor: ['#10b981', '#f43f5e'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    const poliCounts = {};
    surveys.filter(s => s.rating === 'TIDAK PUAS').forEach(s => {
        poliCounts[s.poli] = (poliCounts[s.poli] || 0) + 1;
    });

    const poliLabels = Object.keys(poliCounts);
    const poliData = Object.values(poliCounts);

    const ctxPoli = document.getElementById('poliChart').getContext('2d');
    if (poliChartInstance) poliChartInstance.destroy();
    poliChartInstance = new Chart(ctxPoli, {
        type: 'bar',
        data: {
            labels: poliLabels.length ? poliLabels : ['Belum ada data'],
            datasets: [{
                label: 'Jumlah Tidak Puas',
                data: poliData.length ? poliData : [0],
                backgroundColor: '#f43f5e',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function renderTable() {
    const surveys = getSurveys();
    const filter = document.getElementById('filterPoli').value;
    const tbody = document.getElementById('surveyTableBody');
    tbody.innerHTML = '';

    const filtered = surveys.filter(s => {
        if (filter && s.poli !== filter) return false;
        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-6 px-6 text-center text-slate-400 italic">Belum ada data survei yang tercatat.</td></tr>`;
        return;
    }

    filtered.forEach(s => {
        const dateObj = new Date(s.timestamp);
        const formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        const badgeColor = s.rating === 'PUAS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';
        const icon = s.rating === 'PUAS' ? 'fa-face-smile' : 'fa-face-frown';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition';
        tr.innerHTML = `
            <td class="py-3 px-6 text-xs text-slate-500 whitespace-nowrap">${formattedDate}</td>
            <td class="py-3 px-6 whitespace-nowrap"><span class="px-3 py-1 rounded-full text-xs font-bold ${badgeColor} inline-flex items-center space-x-1"><i class="fa-solid ${icon} mr-1"></i>${s.rating}</span></td>
            <td class="py-3 px-6 font-medium text-slate-700 whitespace-nowrap">${s.poli}</td>
            <td class="py-3 px-6 text-slate-600">${s.saran}</td>
        `;
        tbody.appendChild(tr);
    });
}

function exportCSV() {
    const surveys = getSurveys();
    if (surveys.length === 0) {
        alert('Tidak ada data untuk diekspor!');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Waktu,Penilaian,Poli/Unit,Kritik dan Saran\r\n";
    surveys.forEach(s => {
        const row = [s.timestamp, s.rating, `"${s.poli}"`, `"${s.saran.replace(/"/g, '""')}"`];
        csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `survei_kepuasan_pasongsongan_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
