import subprocess
import os
from flask import Flask, request, jsonify, render_template, send_file, session, redirect, url_for

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Required for session management (use a secure key in production)

# Shared folder path on your Samba server
SHARED_FOLDER_PATH = "/home/sambauser/shared_folder"  # Update with your actual local Samba folder path

@app.route('/')
def home():
    if 'username' in session:
        return redirect(url_for('shared_folders'))
    return render_template('login.html')  # Login page for users

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']
    try:
        command = [
            'smbclient', f"//192.168.0.104/shared_folder", '-U', f"{username}%{password}", '-c', 'dir'
        ]
        result = subprocess.run(command, capture_output=True, text=True)

        if result.returncode == 0:
            session['username'] = username
            return jsonify({'message': 'Login successful!', 'redirect': '/shared_folders'})
        else:
            return jsonify({'message': 'Incorrect username or password!'}), 400
    except Exception as e:
        return jsonify({'message': f"Error: {str(e)}"}), 500

@app.route('/shared_folders')
def shared_folders():
    if 'username' not in session:
        return redirect(url_for('home'))
    
    username = session['username']
    try:
        command = ['/usr/bin/smbclient', f"//192.168.0.104/shared_folder", '-U', f'{session["username"]}%jihad', '-c', 'dir']
        result = subprocess.run(command, capture_output=True, text=True)

        if result.returncode == 0:
            items = []
            for line in result.stdout.splitlines():
                if line.startswith('  ') and not line.strip().startswith(('.', '..')):
                    parts = line.split()
                    name = parts[0]  # File or folder name
                    type_flag = parts[1]  # Type (D for directory, A for file)
                    item_type = 'folder' if type_flag == 'D' else 'file'
                    items.append({'name': name, 'type': item_type})
            return render_template('shared_folders.html', items=items, username=username)
        else:
            return jsonify({'message': 'Failed to list items in the shared folder'}), 400
    except Exception as e:
        return jsonify({'message': f"Error: {str(e)}"}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    try:
        file_path = os.path.join(SHARED_FOLDER_PATH, file.filename)
        file.save(file_path)
        return jsonify({'message': f'File "{file.filename}" uploaded successfully!'})
    except Exception as e:
        return jsonify({'message': f"Error during upload: {str(e)}"}), 500

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    try:
        file_path = os.path.join(SHARED_FOLDER_PATH, filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return jsonify({'message': f'File "{filename}" not found!'}), 404
    except Exception as e:
        return jsonify({'message': f"Error during download: {str(e)}"}), 500

# Logout functionality
@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
