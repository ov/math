var questions = [];
var current = -1;

var MIN_RES = 0, MAX_RES = 20, MIN_ARG = 1, MAX_ARG = 20;

function getKey(a, b, type)
{
	return type + a * 1000 + b;
}

function getStats(a, b, type)
{
	if (localStorage.stats == null)
		return 0;

	var stats = JSON.parse(localStorage.stats);

	var key = getKey(a, b, type);
	if (key in stats)
		return stats[key];

	return 0;
}

function setStats(a, b, type, val)
{
	var stats = localStorage.stats;
	if (stats == null)
		stats = {};
	else
		stats = JSON.parse(stats);

	var key = getKey(a, b, type);
	stats[key] = val;
	localStorage.stats = JSON.stringify(stats);
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

function rnd(min, max)
{
	return Math.floor(min + Math.random() * (max - min));
}

function next_question()
{
	$("#test_ok").hide();
	$("#test_fail").hide();
	$("#test_answer").val("");
	$("#submit_answer").show();

	current += 1;
	if (current < questions.length)
	{
		var q = questions[current];
		$("#test_a").text(q["a"]);
		$("#test_op").text(q["op"]);
		$("#test_b").text(q["b"]);
		$("#test_title").text("Question " + (current + 1) + " of " + questions.length);
		$("#test_answer").focus();
	}
	else
	{
		$(".test-field").hide();

		for (var i = 0; i < questions.length; i++)
		{
			var q = questions[i];
			var line = jQuery("<tr/>");
			var ok = q["answer"] == q["res"];

			var td1 = jQuery("<td>");
			var td2 = jQuery("<td>");
			var td3 = jQuery("<td>");
			var td4 = jQuery("<td>");
			var td5 = jQuery("<td>");
			var td6 = jQuery("<td>");
			var td7 = jQuery("<td>");

			td1.text(i + 1);
			td1.addClass("num");
			td2.text(q["a"]);
			td3.text(q["op"]);
			td4.text(q["b"]);
			td5.text("=");
			td6.text(q["res"]);
			if (!ok)
			{
				td7.addClass("wrong");
				td7.text(q["answer"]);
			}

			line.append(td1);
			line.append(td2);
			line.append(td3);
			line.append(td4);
			line.append(td5);
			line.append(td6);
			line.append(td7);

			$(".test-results table.stats tbody").append(line);
		}

		// stats
		fillTable($("#stats_add"), "+");
		fillTable($("#stats_sub"), "-");

		$(".test-results").show();
	}
}

function fillTable(table, stats)
{
	var tr = jQuery("<tr/>");
	tr.append(jQuery("<th/>"));
	for (var b = MIN_ARG; b <= MAX_ARG; b++)
	{
		var th = jQuery("<th/>");
		th.text(b);
		tr.append(th);
	}
	table.append(tr);

	for (var a = MIN_ARG; a <= MAX_ARG; a++)
	{
		var tr = jQuery("<tr/>");
		var th = jQuery("<th/>");
		th.text(a);
		tr.append(th);

		for (var b = MIN_ARG; b <= MAX_ARG; b++)
		{
			var td = jQuery("<td/>");
			var c = getStats(a, b, stats);
			if (c != 0)
			{
				td.text(c);
				td.addClass(c > 0 ? "good" : "wrong");
			}
			tr.append(td);
		}
		table.append(tr);
	}
}

$("#start_new_test").click(function() {

	var candidates = [];

	for (var a = MIN_ARG; a <= MAX_ARG; a++)
	{
		for (var b = MIN_ARG; b <= MAX_ARG; b++)
		{
			// addition
			if (a + b <= MAX_RES)
			{
				var s = getStats(a, b, "+");
				var cnt = s > 1 ? 1 : 10 - s;
				var key = a * 1000 + b;
				while(cnt-- > 0) candidates.push(key);
			}
			// subtraction
			if (a >= b)
			{
				var s = getStats(a, b, "-");
				var cnt = s > 1 ? 1 : 10 - s;
				var key = -a * 1000 - b;
				while(cnt-- > 0) candidates.push(key);
			}
		}
	}

	candidates = shuffle(candidates);

	var N = 40;
	questions = [];

	for (var i = 0; i < N; i++)
	{
		var idx = rnd(0, candidates.length);
		var key = candidates[idx];
		candidates.remove(key);

		var op = "+";
		if (key < 0)
		{
			op = "-";
			key = -key;
		}

		var a = Math.floor(key / 1000);
		var b = key % 1000;

		var c = op == "+" ? a + b : a - b;

		questions.push({"a":a, "op":op, "b":b, "res":c});
	}

	current = -1;
	$(".start").hide();
	$(".test-field").show();
	next_question();

	$("#test_answer").enterKey(function () {
		if ($("#submit_answer").is(':visible'))
			$("#submit_answer").click();
	});
});

$("#submit_answer").click(function() {
	var answer = $("#test_answer").val();

	var q = questions[current];

	var correct = q["res"];

	q["answer"] = answer;

	$(this).hide();

	var a = q["a"], b = q["b"], op = q["op"];
	var stats_val = getStats(a, b, op);

	var d = 2000;
	if (answer == correct)
	{
		stats_val += 1;
		$("#test_ok").show();
	}
	else
	{
		stats_val -= 1;
		$("#test_fail").show();
		d = 5000;
	}

	setStats(a, b, op, stats_val);

	setTimeout(next_question, d);
});

$.fn.enterKey = function (fnc) {
    return this.each(function () {
        $(this).keypress(function (ev) {
            var keycode = (ev.keyCode ? ev.keyCode : ev.which);
            if (keycode == '13') {
                fnc.call(this, ev);
            }
        })
    })
}

