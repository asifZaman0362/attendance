function try_login() {
	if (document.login) {
		let form = document.login;
		if (!form.username.value || !form.password.value) {
			
		}
		else {
			
		}
	}
}

function editAdmin(element) {
	let id = element.id;
	document.adminListForm.edit_id.value = id;
	document.adminListForm.submit();
}

function editTeacher(element) {
	let id = element.id;
	document.teacherListForm.edit_id.value = id;
	document.teacherListForm.submit();
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