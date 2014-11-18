var questions = [];
var current = -1;

var current_time = 0;
var timeout_id = 0;

var MIN_ARG = 2, MAX_ARG = 5;
var QUESTIONS_NUMBER = 30;
var DELAY_CORRECT = 2000, DELAY_INCORRECT = 5000;
var TIME_MS = 12000, TIME_TICK = 500;


function getKey(a, b)
{
	return a * 1000 + b;
}

function getStats(a, b)
{
	if (localStorage.mult_stats == null)
		return 0;

	var stats = JSON.parse(localStorage.mult_stats);

	var key = getKey(a, b);
	if (key in stats)
		return stats[key];

	return 0;
}

function setStats(a, b, val)
{
	var stats = localStorage.mult_stats;
	if (stats == null)
		stats = {};
	else
		stats = JSON.parse(stats);

	var key = getKey(a, b);
	stats[key] = val;
	localStorage.mult_stats = JSON.stringify(stats);
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

function set_progress()
{
	p = current_time * 100 / TIME_MS;
	$("#timer_progress").css("width", "" + p + "%").attr("aria-valuenow", p);
}

function on_timer()
{
	time = current_time - TIME_TICK;
	if (time >= 0)
	{
		current_time = time;
		set_progress();
		start_timer();
	}
	else
	{
		current_time = 0;
		set_progress();

		var q = questions[current];
		var correct = q["res"];
		q["answer"] = "";
		$("#submit_answer").hide();
		$("#test_answer").prop("disabled", true);
		$("#test_late").show();

		var a = q["a"], b = q["b"];
		var stats_val = getStats(a, b);
		stats_val -= 1;
		setStats(a, b, stats_val);

		setTimeout(next_question, DELAY_INCORRECT);
	}
}

function start_timer()
{
	timeout_id = window.setTimeout(on_timer, TIME_TICK);
}

function init_timer()
{
	$("#timer_progress").removeClass("active");
	current_time = TIME_MS;
	set_progress();
	start_timer();
}

function next_question()
{
	$("#test_ok").hide();
	$("#test_fail").hide();
	$("#test_late").hide();
	$("#test_answer").val("").prop("disabled", false);
	$("#submit_answer").show();

	current += 1;
	if (current < questions.length)
	{
		var q = questions[current];
		$("#test_a").text(q["a"]);
		$("#test_b").text(q["b"]);
		$("#test_title").text("Question " + (current + 1) + " of " + questions.length);

		init_timer();

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
			td3.text("*");
			td4.text(q["b"]);
			td5.text(" = ");
			td6.text(q["res"]);
			if (!ok)
			{
				td6.addClass("wrong");
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
		fillTable($("#stats_mult"));

		$(".test-results").show();
	}
}

function fillTable(table)
{
	var tr = jQuery("<tr/>");
	tr.append(jQuery("<th/>"));
	for (var b = 1; b <= 10; b++)
	{
		var th = jQuery("<th/>");
		th.text(b);
		tr.append(th);
	}
	table.append(tr);

	for (var a = 1; a <= 10; a++)
	{
		var tr = jQuery("<tr/>");
		var th = jQuery("<th/>");
		th.text(a);
		tr.append(th);

		for (var b = 1; b <= 10; b++)
		{
			var td = jQuery("<td/>");
			var c = getStats(a, b);
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

	for (var a = 1; a <= 10; a++)
	{
		for (var b = MIN_ARG; b <= MAX_ARG; b++)
		{
			aa = a;
			bb = b;
			if (rnd(0, 2) == 0)
			{
				t = aa;
				aa = bb;
				bb = t;
			}
			var s = getStats(aa, bb);
			var cnt = s > 1 ? 1 : 10 - s;
			var key = aa * 1000 + bb;
			while(cnt-- > 0) candidates.push(key);
		}
	}

	candidates = shuffle(candidates);

	questions = [];

	for (var i = 0; i < QUESTIONS_NUMBER; i++)
	{
		var idx = rnd(0, candidates.length);
		var key = candidates[idx];
		candidates.remove(key);

		var a = Math.floor(key / 1000);
		var b = key % 1000;

		var c = a * b;

		questions.push({"a":a, "b":b, "res":c});
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
	if (answer == "" || isNaN(answer)) {
		$("#test_answer").val("");
		$("#test_answer").focus();
	 	return;	
	}

	if (timeout_id != 0)
	{
		window.clearTimeout(timeout_id);
		timeout_id = 0;
	}

	$("#test_answer").prop("disabled", true);

	var q = questions[current];

	var correct = q["res"];

	q["answer"] = answer;

	$(this).hide();

	var a = q["a"], b = q["b"];
	var stats_val = getStats(a, b);

	var d = DELAY_CORRECT;
	if (answer == correct)
	{
		stats_val += 1;
		$("#test_ok").show();
	}
	else
	{
		stats_val -= 1;
		$("#test_fail").show();
		d = DELAY_INCORRECT;
	}

	setStats(a, b, stats_val);

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

