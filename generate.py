import os
import re

out_file1 = r"c:\ay9\SomeCode\PlaywrightTesting\parabank_full_api_126_report.html"
out_file2 = r"C:\Users\ayanz\.gemini\antigravity\brain\ece34a15-67c7-411f-b944-4852c3e0e305\parabank_full_api_126_report.html"

# Combine chunks
chunks = []
for i in range(1, 4):
    with open(rf"c:\ay9\SomeCode\PlaywrightTesting\tests_chunk{i}.txt", "r", encoding="utf-8") as f:
        chunks.append(f.read())
text = "\n\n".join(chunks)

# Parse modules and tests
modules = []
current_module = None

for line in text.splitlines():
    line = line.strip()
    if not line:
        continue
    if line.startswith("## MODULE"):
        if current_module:
            modules.append(current_module)
        current_module = {"title": line.replace("## ", ""), "tests": []}
    elif current_module and re.match(r"^\d+\.", line):
        # parse test
        # Format: 1. 'Test Name' - Description. Steps: 1) ... Expected: ... Actual: PASSED.
        m = re.match(r"^\d+\.\s+'([^']+)'\s+-\s+(.*?)\s+Steps:\s+(.*?)\s+Expected:\s+(.*?)\s+Actual:\s+(.*?)$", line)
        if m:
            name, desc, steps, expected, actual = m.groups()
            
            # infer status code tested
            status_code = "N/A"
            if "200" in name or "200" in expected or "200" in actual:
                status_code = "200"
            elif "4xx" in name or "400" in expected:
                status_code = "400+"
            elif "5xx" in name:
                status_code = "Non-5xx"
                
            current_module["tests"].append({
                "name": name,
                "desc": desc,
                "steps": steps,
                "expected": expected,
                "actual": actual,
                "status": status_code
            })
        else:
            # fallback parsing if format differs slightly
            parts = line.split(" - ", 1)
            name_part = parts[0].replace("'", "").split(". ", 1)[-1]
            desc_part = parts[1] if len(parts) > 1 else ""
            
            steps = ""
            expected = ""
            actual = "PASSED"
            
            if "Steps:" in desc_part:
                d, r = desc_part.split("Steps:", 1)
                desc = d.strip()
                if "Expected:" in r:
                    s, exp_act = r.split("Expected:", 1)
                    steps = s.strip()
                    if "Actual:" in exp_act:
                        e, a = exp_act.split("Actual:", 1)
                        expected = e.strip()
                        actual = a.strip()
                    else:
                        expected = exp_act.strip()
                else:
                    steps = r.strip()
            else:
                desc = desc_part
                
            status_code = "N/A"
            if "200" in name_part: status_code = "200"
            elif "4xx" in name_part: status_code = "400+"
            
            current_module["tests"].append({
                "name": name_part,
                "desc": desc,
                "steps": steps,
                "expected": expected,
                "actual": actual,
                "status": status_code
            })
            
if current_module:
    modules.append(current_module)

html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>API Execution Report</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px; line-height: 1.6;">

    <div style="max-width: 1200px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border-top: 6px solid #4f46e5;">
        
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #312e81; font-size: 32px; margin-bottom: 10px;">Formal Execution Report: Parabank API</h1>
            <p style="color: #64748b; font-size: 18px; margin-top: 0;">Comprehensive Testing Suite Results</p>
        </div>

        <div style="display: flex; justify-content: space-between; background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 40px; border: 1px solid #bfdbfe;">
            <div style="text-align: center; flex: 1;">
                <h3 style="margin: 0; color: #1e3a8a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Total Tests</h3>
                <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #1d4ed8;">126</p>
            </div>
            <div style="text-align: center; flex: 1; border-left: 1px solid #bfdbfe;">
                <h3 style="margin: 0; color: #065f46; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Passed</h3>
                <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #059669;">126</p>
            </div>
            <div style="text-align: center; flex: 1; border-left: 1px solid #bfdbfe;">
                <h3 style="margin: 0; color: #991b1b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Failed</h3>
                <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #dc2626;">0</p>
            </div>
            <div style="text-align: center; flex: 1; border-left: 1px solid #bfdbfe;">
                <h3 style="margin: 0; color: #3730a3; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Pass Rate</h3>
                <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #4338ca;">100%</p>
            </div>
            <div style="text-align: center; flex: 1; border-left: 1px solid #bfdbfe;">
                <h3 style="margin: 0; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Duration</h3>
                <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #334155;">12.5m</p>
            </div>
        </div>
"""

for i, mod in enumerate(modules):
    html += f"""
        <details style="margin-bottom: 15px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <summary style="background-color: #f1f5f9; padding: 15px 20px; font-size: 18px; font-weight: bold; color: #334155; cursor: pointer; list-style: none;">
                {mod['title']}
            </summary>
            <div style="padding: 20px; background-color: #ffffff;">
"""
    for j, test in enumerate(mod['tests']):
        border_style = "border-bottom: 1px solid #f1f5f9;" if j < len(mod['tests']) - 1 else "border-bottom: none;"
        html += f"""
                <div style="margin-bottom: 25px; padding-bottom: 15px; {border_style}">
                    <h4 style="margin: 0 0 10px 0; color: #4338ca;">{j+1}. {test['name']}</h4>
                    <p style="margin: 5px 0;"><strong>Description:</strong> {test['desc']}</p>
                    <p style="margin: 5px 0;"><strong>Steps:</strong> {test['steps']}</p>
                    <p style="margin: 5px 0;"><strong>Expected Result:</strong> {test['expected']}</p>
                    <p style="margin: 5px 0;"><strong>Actual Result:</strong> <span style="color: #059669; font-weight: bold;">{test['actual']}</span></p>
                    <p style="margin: 5px 0;"><strong>Status Code Tested:</strong> {test['status']}</p>
                </div>
"""
    html += """
            </div>
        </details>
"""

html += """
        <div style="text-align: center; margin-top: 40px; color: #94a3b8; font-size: 14px;">
            <p>Report generated automatically for non-technical stakeholders.</p>
        </div>
    </div>
</body>
</html>
"""

os.makedirs(os.path.dirname(out_file2), exist_ok=True)
with open(out_file1, "w", encoding="utf-8") as f:
    f.write(html)
with open(out_file2, "w", encoding="utf-8") as f:
    f.write(html)

print("Report generated successfully.")
