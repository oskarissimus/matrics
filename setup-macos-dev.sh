#!/bin/bash

# macOS Development Environment Setup
# This script configures:
# 1. Touch ID for sudo (survives macOS updates)
# 2. Karabiner Elements with F5 shortcut for Claude Code voice mode

set -e

echo "=== macOS Development Environment Setup ==="
echo ""

# --- Touch ID for sudo ---
echo "[1/3] Configuring Touch ID for sudo..."

SUDO_LOCAL="/etc/pam.d/sudo_local"
SUDO_LOCAL_TEMPLATE="/etc/pam.d/sudo_local.template"

if [ -f "$SUDO_LOCAL" ] && grep -q "^auth.*pam_tid.so" "$SUDO_LOCAL"; then
    echo "  ✓ Touch ID for sudo already configured"
else
    if [ -f "$SUDO_LOCAL_TEMPLATE" ]; then
        echo "  Copying template and enabling Touch ID..."
        sudo cp "$SUDO_LOCAL_TEMPLATE" "$SUDO_LOCAL"
        sudo sed -i '' 's/#auth/auth/' "$SUDO_LOCAL"
        echo "  ✓ Touch ID for sudo enabled via sudo_local"
    else
        echo "  Template not found, adding to /etc/pam.d/sudo..."
        sudo sed -i '' '2i\
auth       sufficient     pam_tid.so
' /etc/pam.d/sudo
        echo "  ✓ Touch ID for sudo enabled (note: may need re-apply after macOS updates)"
    fi
fi

# --- Karabiner Elements ---
echo ""
echo "[2/3] Setting up Karabiner Elements..."

if [ -d "/Applications/Karabiner-Elements.app" ]; then
    echo "  ✓ Karabiner Elements already installed"
else
    echo "  Downloading Karabiner Elements..."
    KARABINER_VERSION="15.7.0"
    KARABINER_DMG="/tmp/Karabiner-Elements.dmg"
    curl -L -o "$KARABINER_DMG" "https://github.com/pqrs-org/Karabiner-Elements/releases/download/v${KARABINER_VERSION}/Karabiner-Elements-${KARABINER_VERSION}.dmg"

    echo "  Mounting DMG..."
    hdiutil attach "$KARABINER_DMG" -nobrowse -quiet

    echo "  Installing (requires admin password)..."
    sudo installer -pkg "/Volumes/Karabiner-Elements-${KARABINER_VERSION}/Karabiner-Elements.pkg" -target /

    echo "  Cleaning up..."
    hdiutil detach "/Volumes/Karabiner-Elements-${KARABINER_VERSION}" -quiet
    rm "$KARABINER_DMG"

    echo "  ✓ Karabiner Elements installed"
fi

# --- Karabiner Configuration ---
echo ""
echo "[3/3] Configuring Karabiner for Claude Code voice mode (F5)..."

KARABINER_CONFIG_DIR="$HOME/.config/karabiner"
KARABINER_CONFIG="$KARABINER_CONFIG_DIR/karabiner.json"

mkdir -p "$KARABINER_CONFIG_DIR"

if [ -f "$KARABINER_CONFIG" ]; then
    echo "  Karabiner config exists, checking for voice mode rule..."
    if grep -q "voicemode:converse" "$KARABINER_CONFIG"; then
        echo "  ✓ Voice mode rule already configured"
    else
        echo "  Adding voice mode rule to existing config..."
        # Use Python to safely merge JSON
        python3 << 'PYTHON'
import json
import os

config_path = os.path.expanduser("~/.config/karabiner/karabiner.json")
with open(config_path, 'r') as f:
    config = json.load(f)

new_rule = {
    "description": "F5 (microphone key) triggers /voicemode:converse in Terminal",
    "manipulators": [{
        "type": "basic",
        "from": {"key_code": "f5"},
        "to": [
            {"key_code": "slash"},
            {"key_code": "v"}, {"key_code": "o"}, {"key_code": "i"},
            {"key_code": "c"}, {"key_code": "e"}, {"key_code": "m"},
            {"key_code": "o"}, {"key_code": "d"}, {"key_code": "e"},
            {"key_code": "semicolon", "modifiers": ["shift"]},
            {"key_code": "c"}, {"key_code": "o"}, {"key_code": "n"},
            {"key_code": "v"}, {"key_code": "e"}, {"key_code": "r"},
            {"key_code": "s"}, {"key_code": "e"},
            {"key_code": "return_or_enter"}
        ],
        "conditions": [{
            "type": "frontmost_application_if",
            "bundle_identifiers": [
                "^com\\.apple\\.Terminal$",
                "^com\\.googlecode\\.iterm2$",
                "^io\\.alacritty$",
                "^com\\.github\\.wez\\.wezterm$"
            ]
        }]
    }]
}

if 'profiles' in config and len(config['profiles']) > 0:
    if 'complex_modifications' not in config['profiles'][0]:
        config['profiles'][0]['complex_modifications'] = {'rules': []}
    if 'rules' not in config['profiles'][0]['complex_modifications']:
        config['profiles'][0]['complex_modifications']['rules'] = []
    config['profiles'][0]['complex_modifications']['rules'].append(new_rule)

with open(config_path, 'w') as f:
    json.dump(config, f, indent=4)

print("  ✓ Voice mode rule added")
PYTHON
    fi
else
    echo "  Creating new Karabiner config with voice mode rule..."
    cat > "$KARABINER_CONFIG" << 'KARABINER_JSON'
{
    "profiles": [
        {
            "name": "Default profile",
            "selected": true,
            "complex_modifications": {
                "rules": [
                    {
                        "description": "F5 (microphone key) triggers /voicemode:converse in Terminal",
                        "manipulators": [
                            {
                                "type": "basic",
                                "from": {"key_code": "f5"},
                                "to": [
                                    {"key_code": "slash"},
                                    {"key_code": "v"}, {"key_code": "o"}, {"key_code": "i"},
                                    {"key_code": "c"}, {"key_code": "e"}, {"key_code": "m"},
                                    {"key_code": "o"}, {"key_code": "d"}, {"key_code": "e"},
                                    {"key_code": "semicolon", "modifiers": ["shift"]},
                                    {"key_code": "c"}, {"key_code": "o"}, {"key_code": "n"},
                                    {"key_code": "v"}, {"key_code": "e"}, {"key_code": "r"},
                                    {"key_code": "s"}, {"key_code": "e"},
                                    {"key_code": "return_or_enter"}
                                ],
                                "conditions": [
                                    {
                                        "type": "frontmost_application_if",
                                        "bundle_identifiers": [
                                            "^com\\.apple\\.Terminal$",
                                            "^com\\.googlecode\\.iterm2$",
                                            "^io\\.alacritty$",
                                            "^com\\.github\\.wez\\.wezterm$"
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            "virtual_hid_keyboard": {
                "country_code": 0,
                "keyboard_type_v2": "ansi"
            }
        }
    ]
}
KARABINER_JSON
    echo "  ✓ Karabiner config created"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "What's configured:"
echo "  • Touch ID works for sudo commands in Terminal"
echo "  • F5 key triggers /voicemode:converse in Terminal apps"
echo ""
echo "Next steps:"
echo "  1. Open Karabiner Elements and grant required permissions"
echo "  2. Test Touch ID: run 'sudo whoami' in Terminal"
echo "  3. Test voice mode: press F5 in Terminal while running Claude Code"
echo ""
