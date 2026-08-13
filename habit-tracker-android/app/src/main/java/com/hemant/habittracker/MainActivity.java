package com.hemant.habittracker;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TableLayout;
import android.widget.TableRow;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.DateFormatSymbols;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final String PREFS = "habit_tracker_prefs";
    private static final String HABITS_KEY = "habits_json";

    private final String[] defaultHabits = {
            "Wake up early (5:30 AM)",
            "Drink warm water",
            "Meditation (15 min)",
            "Exercise / Workout (45 min)",
            "Reading (20 min)",
            "Study (Deep Work)",
            "Eat Healthy Food",
            "No Junk Food",
            "No Social Media (Morning)",
            "Learn Something New",
            "Help Parents",
            "Practice Gratitude",
            "No Fap / Self Control",
            "Sleep Before 10:30 PM",
            "Night Routine (Skincare, etc.)"
    };

    private SharedPreferences prefs;
    private LinearLayout root;
    private TableLayout table;
    private TextView monthTitle;
    private TextView monthlyScore;
    private EditText notesEdit;
    private List<String> habits = new ArrayList<>();
    private int month;
    private int year;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        Calendar now = Calendar.getInstance();
        month = now.get(Calendar.MONTH);
        year = now.get(Calendar.YEAR);
        habits = loadHabits();
        buildLayout();
        render();
    }

    private void buildLayout() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(12), dp(10), dp(12), dp(16));
        root.setBackgroundColor(color("#F7F8FC"));
        scroll.addView(root);
        setContentView(scroll);

        TextView title = text("HABIT TRACKER", 28, true);
        title.setGravity(Gravity.CENTER);
        title.setTextColor(color("#0F2138"));
        root.addView(title, matchWrap());

        TextView quote = text("\"Discipline is choosing between what you want now and what you want most.\"", 13, false);
        quote.setGravity(Gravity.CENTER);
        quote.setTextColor(color("#465266"));
        root.addView(quote, matchWrap());

        LinearLayout controls = row();
        controls.setGravity(Gravity.CENTER_VERTICAL);
        controls.setPadding(0, dp(14), 0, dp(8));
        Button prev = actionButton("<");
        Button next = actionButton(">");
        monthTitle = text("", 18, true);
        monthTitle.setGravity(Gravity.CENTER);
        prev.setOnClickListener(v -> changeMonth(-1));
        next.setOnClickListener(v -> changeMonth(1));
        controls.addView(prev, new LinearLayout.LayoutParams(dp(48), dp(42)));
        controls.addView(monthTitle, new LinearLayout.LayoutParams(0, dp(42), 1));
        controls.addView(next, new LinearLayout.LayoutParams(dp(48), dp(42)));
        root.addView(controls);

        LinearLayout stats = row();
        stats.setPadding(0, 0, 0, dp(10));
        monthlyScore = text("", 14, true);
        monthlyScore.setGravity(Gravity.CENTER);
        monthlyScore.setTextColor(color("#0F2138"));
        monthlyScore.setBackground(box("#EAF5EA", "#BFD4C2", 8));
        stats.addView(monthlyScore, new LinearLayout.LayoutParams(0, dp(46), 1));
        root.addView(stats);

        HorizontalScrollView hScroll = new HorizontalScrollView(this);
        hScroll.setFillViewport(false);
        table = new TableLayout(this);
        table.setShrinkAllColumns(false);
        table.setStretchAllColumns(false);
        hScroll.addView(table);
        root.addView(hScroll, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        LinearLayout buttons = row();
        buttons.setPadding(0, dp(12), 0, dp(8));
        Button add = actionButton("Add Habit");
        Button share = actionButton("Share Summary");
        Button reset = actionButton("Clear Month");
        add.setOnClickListener(v -> showHabitDialog(-1));
        share.setOnClickListener(v -> shareSummary());
        reset.setOnClickListener(v -> confirmClearMonth());
        buttons.addView(add, new LinearLayout.LayoutParams(0, dp(44), 1));
        buttons.addView(share, new LinearLayout.LayoutParams(0, dp(44), 1));
        buttons.addView(reset, new LinearLayout.LayoutParams(0, dp(44), 1));
        root.addView(buttons);

        TextView notesLabel = text("NOTES", 13, true);
        notesLabel.setTextColor(color("#0F2138"));
        root.addView(notesLabel);
        notesEdit = new EditText(this);
        notesEdit.setMinLines(3);
        notesEdit.setGravity(Gravity.TOP | Gravity.START);
        notesEdit.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE);
        notesEdit.setSingleLine(false);
        notesEdit.setImeOptions(EditorInfo.IME_ACTION_NONE);
        notesEdit.setTextColor(color("#0F2138"));
        notesEdit.setHint("Monthly notes...");
        notesEdit.setBackground(box("#FFFFFF", "#BFC5CF", 8));
        notesEdit.setPadding(dp(10), dp(8), dp(10), dp(8));
        notesEdit.setOnFocusChangeListener((v, hasFocus) -> {
            if (!hasFocus) saveNotes();
        });
        root.addView(notesEdit, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(110)));
    }

    private void render() {
        monthTitle.setText(monthName(month) + " " + year);
        table.removeAllViews();
        addHeaderRows();
        JSONObject checks = loadChecks();
        int days = daysInMonth();
        int totalPossible = habits.size() * days;
        int completedPossible = 0;

        for (int i = 0; i < habits.size(); i++) {
            String habit = habits.get(i);
            boolean[] values = valuesFor(checks, habit);
            int completed = countDone(values, days);
            completedPossible += completed;
            addHabitRow(i, habit, values, completed, days);
        }

        int score = totalPossible == 0 ? 0 : Math.round((completedPossible * 100f) / totalPossible);
        monthlyScore.setText("Monthly Score: " + completedPossible + "/" + totalPossible + " days complete (" + score + "%)");
        notesEdit.setText(prefs.getString(notesKey(), ""));
    }

    private void addHeaderRows() {
        TableRow header = new TableRow(this);
        header.addView(cell("Habit\nNo.", 52, "#DDEBDD", true));
        header.addView(cell("HABITS", 210, "#DDEBDD", true));
        for (int day = 1; day <= 31; day++) {
            header.addView(cell(String.valueOf(day), 38, "#EAF5EA", true));
        }
        header.addView(cell("Total\nDays", 72, "#FFF3CD", true));
        header.addView(cell("Completed\nDays", 92, "#EAF5EA", true));
        header.addView(cell("Success\nRate", 80, "#DCEAF8", true));
        table.addView(header);
    }

    private void addHabitRow(int index, String habit, boolean[] values, int completed, int days) {
        TableRow row = new TableRow(this);
        row.addView(cell(String.valueOf(index + 1), 52, "#FFFFFF", false));

        TextView habitCell = cell(habit, 210, "#FFFFFF", false);
        habitCell.setGravity(Gravity.CENTER_VERTICAL | Gravity.START);
        habitCell.setPadding(dp(10), 0, dp(8), 0);
        habitCell.setOnClickListener(v -> showHabitActions(index));
        row.addView(habitCell);

        for (int day = 1; day <= 31; day++) {
            CheckBox box = new CheckBox(this);
            box.setGravity(Gravity.CENTER);
            box.setButtonTintList(android.content.res.ColorStateList.valueOf(color("#2E7D62")));
            box.setBackground(box("#FFFFFF", "#C7CBD3", 0));
            box.setPadding(0, 0, 0, 0);
            box.setEnabled(day <= days);
            box.setChecked(day <= days && values[day - 1]);
            int selectedDay = day - 1;
            box.setOnCheckedChangeListener((buttonView, isChecked) -> {
                JSONObject current = loadChecks();
                boolean[] updated = valuesFor(current, habit);
                updated[selectedDay] = isChecked;
                putValues(current, habit, updated);
                saveChecks(current);
                render();
            });
            row.addView(box, new TableRow.LayoutParams(dp(38), dp(42)));
        }

        row.addView(cell(String.valueOf(days), 72, "#FFF9E8", false));
        row.addView(cell(String.valueOf(completed), 92, "#F0F8F0", false));
        int rate = days == 0 ? 0 : Math.round((completed * 100f) / days);
        row.addView(cell(rate + "%", 80, "#EDF6FF", false));
        table.addView(row);
    }

    private void showHabitActions(int index) {
        String[] actions = {"Edit habit", "Delete habit"};
        new AlertDialog.Builder(this)
                .setTitle(habits.get(index))
                .setItems(actions, (dialog, which) -> {
                    if (which == 0) showHabitDialog(index);
                    if (which == 1) deleteHabit(index);
                })
                .show();
    }

    private void showHabitDialog(int index) {
        EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        input.setText(index >= 0 ? habits.get(index) : "");
        input.setSelection(input.getText().length());
        new AlertDialog.Builder(this)
                .setTitle(index >= 0 ? "Edit Habit" : "Add Habit")
                .setView(input)
                .setPositiveButton("Save", (dialog, which) -> {
                    String name = input.getText().toString().trim();
                    if (name.isEmpty()) {
                        Toast.makeText(this, "Habit name required", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    if (index >= 0) {
                        renameHabit(index, name);
                    } else {
                        habits.add(name);
                        saveHabits();
                    }
                    render();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void renameHabit(int index, String newName) {
        String oldName = habits.get(index);
        habits.set(index, newName);
        saveHabits();
        JSONObject checks = loadChecks();
        if (checks.has(oldName)) {
            try {
                checks.put(newName, checks.getJSONArray(oldName));
                checks.remove(oldName);
                saveChecks(checks);
            } catch (JSONException ignored) {
            }
        }
    }

    private void deleteHabit(int index) {
        String habit = habits.get(index);
        new AlertDialog.Builder(this)
                .setTitle("Delete habit?")
                .setMessage(habit)
                .setPositiveButton("Delete", (dialog, which) -> {
                    habits.remove(index);
                    saveHabits();
                    JSONObject checks = loadChecks();
                    checks.remove(habit);
                    saveChecks(checks);
                    render();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void confirmClearMonth() {
        new AlertDialog.Builder(this)
                .setTitle("Clear this month?")
                .setMessage("This removes all checks and notes for " + monthName(month) + " " + year + ".")
                .setPositiveButton("Clear", (dialog, which) -> {
                    prefs.edit().remove(checksKey()).remove(notesKey()).apply();
                    render();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void shareSummary() {
        saveNotes();
        JSONObject checks = loadChecks();
        int days = daysInMonth();
        StringBuilder body = new StringBuilder();
        body.append("Habit Tracker - ").append(monthName(month)).append(" ").append(year).append("\n\n");
        for (String habit : habits) {
            int done = countDone(valuesFor(checks, habit), days);
            int rate = Math.round((done * 100f) / days);
            body.append(habit).append(": ").append(done).append("/").append(days).append(" (").append(rate).append("%)\n");
        }
        String notes = prefs.getString(notesKey(), "").trim();
        if (!notes.isEmpty()) {
            body.append("\nNotes:\n").append(notes);
        }
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType("text/plain");
        send.putExtra(Intent.EXTRA_TEXT, body.toString());
        startActivity(Intent.createChooser(send, "Share habit summary"));
    }

    private void changeMonth(int delta) {
        saveNotes();
        month += delta;
        if (month < 0) {
            month = 11;
            year--;
        } else if (month > 11) {
            month = 0;
            year++;
        }
        render();
    }

    private List<String> loadHabits() {
        List<String> loaded = new ArrayList<>();
        String raw = prefs.getString(HABITS_KEY, null);
        if (raw == null) {
            for (String habit : defaultHabits) loaded.add(habit);
            return loaded;
        }
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) loaded.add(arr.getString(i));
        } catch (JSONException ignored) {
            for (String habit : defaultHabits) loaded.add(habit);
        }
        return loaded;
    }

    private void saveHabits() {
        JSONArray arr = new JSONArray();
        for (String habit : habits) arr.put(habit);
        prefs.edit().putString(HABITS_KEY, arr.toString()).apply();
    }

    private JSONObject loadChecks() {
        try {
            return new JSONObject(prefs.getString(checksKey(), "{}"));
        } catch (JSONException e) {
            return new JSONObject();
        }
    }

    private void saveChecks(JSONObject checks) {
        prefs.edit().putString(checksKey(), checks.toString()).apply();
    }

    private boolean[] valuesFor(JSONObject checks, String habit) {
        boolean[] values = new boolean[31];
        try {
            JSONArray arr = checks.optJSONArray(habit);
            if (arr != null) {
                for (int i = 0; i < Math.min(31, arr.length()); i++) values[i] = arr.optBoolean(i, false);
            }
        } catch (Exception ignored) {
        }
        return values;
    }

    private void putValues(JSONObject checks, String habit, boolean[] values) {
        JSONArray arr = new JSONArray();
        for (boolean value : values) arr.put(value);
        try {
            checks.put(habit, arr);
        } catch (JSONException ignored) {
        }
    }

    private int countDone(boolean[] values, int days) {
        int done = 0;
        for (int i = 0; i < days; i++) if (values[i]) done++;
        return done;
    }

    private void saveNotes() {
        prefs.edit().putString(notesKey(), notesEdit.getText().toString()).apply();
    }

    private String checksKey() {
        return "checks_" + year + "_" + (month + 1);
    }

    private String notesKey() {
        return "notes_" + year + "_" + (month + 1);
    }

    private int daysInMonth() {
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.YEAR, year);
        calendar.set(Calendar.MONTH, month);
        return calendar.getActualMaximum(Calendar.DAY_OF_MONTH);
    }

    private String monthName(int monthIndex) {
        return new DateFormatSymbols(Locale.ENGLISH).getMonths()[monthIndex];
    }

    private TextView cell(String value, int widthDp, String fill, boolean bold) {
        TextView view = text(value, 12, bold);
        view.setGravity(Gravity.CENTER);
        view.setTextColor(color("#0F2138"));
        view.setBackground(box(fill, "#C7CBD3", 0));
        view.setMinWidth(dp(widthDp));
        view.setMinHeight(dp(42));
        view.setPadding(dp(4), dp(4), dp(4), dp(4));
        return view;
    }

    private TextView text(String value, int sizeSp, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(sizeSp);
        view.setIncludeFontPadding(true);
        if (bold) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return view;
    }

    private Button actionButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextColor(color("#FFFFFF"));
        button.setAllCaps(false);
        button.setTextSize(13);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setBackground(box("#2E7D62", "#2E7D62", 8));
        button.setPadding(dp(6), 0, dp(6), 0);
        return button;
    }

    private LinearLayout row() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.HORIZONTAL);
        layout.setGravity(Gravity.CENTER);
        return layout;
    }

    private LinearLayout.LayoutParams matchWrap() {
        return new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
    }

    private GradientDrawable box(String fill, String stroke, int radiusDp) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color(fill));
        drawable.setStroke(dp(1), color(stroke));
        drawable.setCornerRadius(dp(radiusDp));
        return drawable;
    }

    private int color(String hex) {
        return android.graphics.Color.parseColor(hex);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
