import subprocess
import os
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Shared folder path on your Samba server
SHARED_FOLDER_PATH = "//192.168.0.104/shared_folder"  # Update with your actual shared folder path

@app.route('/')
def home():
    return render_template('login.html')  # Login page for users

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']

    # Step 1: Authenticate user using smbclient
    try:
        # Using smbclient to list files in the shared folder to verify authentication
        command = [
            'smbclient', SHARED_FOLDER_PATH, '-U', f"{username}%{password}", '-c', 'dir'
        ]
        result = subprocess.run(command, capture_output=True, text=True)

        # Check if authentication was successful
        if result.returncode == 0:
            # Successful login
            return jsonify({'message': 'Login successful!', 'redirect': '/shared_folders'})
        else:
            # Incorrect credentials
            return jsonify({'message': 'Incorrect username or password for Samba user!'}), 400
    except Exception as e:
        return jsonify({'message': f"Error during authentication: {str(e)}"}), 500

@app.route('/shared_folders')
def shared_folders():
    shared_folder_path = "//192.168.0.104/shared_folder"
    try:
        # Use smbclient to list files and folders in the shared folder
        command = ['/usr/bin/smbclient', shared_folder_path, '-U', 'sambauser%jihad', '-c', 'dir']
        result = subprocess.run(command, capture_output=True, text=True)

        if result.returncode == 0:
            items = []
            for line in result.stdout.splitlines():
                print("Processing line:", line)  # Debugging output
                if line.startswith('  ') and not line.strip().startswith(('.', '..')):
                    parts = line.split()
                    name = parts[0]  # File or folder name
                    type_flag = parts[1]  # File type indicator (D for directory, A for normal file)
                    item_type = 'folder' if type_flag == 'D' else 'file'
                    items.append({'name': name, 'type': item_type})

            print("Parsed items:", items)  # Debug parsed item list

            if items:
                return render_template('shared_folders.html', items=items)
            else:
                return render_template('shared_folders.html', message="No items found in the shared folder.")
        else:
            return jsonify({'message': 'Failed to list items in the shared folder', 
                            'error': result.stderr, 
                            'output': result.stdout}), 400
    except Exception as e:
        return jsonify({'message': f"Error listing shared folder: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
