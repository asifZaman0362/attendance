function try_login() {
	if (document.login) {
		let form = document.login;
		if (!form.username.value || !form.password.value) {
			
		}
		else {
			
		}
	}
}

function edit(element) {
	let id = element.id;
	
}

function saveAttendance() {
	let numbers = [];
	let checkboxes = document.getElementsByClassName("attendance-box");
	for (let box of checkboxes) {
		if (box.checked) numbers.push(parseInt(box.name));
	}
	let json = '[' + numbers.toString() + ']';
	document.attendanceForm.numbers.value = json;
	document.attendanceForm.submit();
}