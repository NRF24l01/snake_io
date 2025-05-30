import random
import time
from threading import Thread
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from copy import deepcopy

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

players = {}
apples = []
trusts = {}  # f"{x},{y}"


def spawn_apple():
    return {'x': random.randint(0, 39), 'y': random.randint(0, 29)}


def random_color():
    return "#{:06x}".format(random.randint(0, 0xFFFFFF))


def update_game_state():
    while True:
        for player_id, player in list(players.items()):
            new_head = {'x': player['x'], 'y': player['y']}

            if player['direction'] == 'UP':
                new_head['y'] -= 1
            elif player['direction'] == 'DOWN':
                new_head['y'] += 1
            elif player['direction'] == 'LEFT':
                new_head['x'] -= 1
            elif player['direction'] == 'RIGHT':
                new_head['x'] += 1

            # Check for collisions with walls
            if new_head['x'] < 0 or new_head['x'] >= 40 or new_head['y'] < 0 or new_head['y'] >= 30:
                socketio.emit('game_over', {'player_id': player_id}, namespace='/')
                # print("sdfosjdfo died", new_head['x'], new_head['y'])
                for tail_part in player["tail"]:
                    trusts[f"{tail_part['x']} {tail_part['y']}"] = "wall"
                del players[player_id]
                continue

            # Check for collisions with self
            if new_head in player['tail'] and False:
                socketio.emit('game_over', {'player_id': player_id}, namespace='/')
                print("sdfosjdfo died", new_head['x'], new_head['y'], player['tail'])
                del players[player_id]
                continue

            # Check for collisions with someone
            if new_head in player['tail'] and False:
                socketio.emit('game_over', {'player_id': player_id}, namespace='/')
                print("sdfosjdfo died", new_head['x'], new_head['y'], player['tail'])
                del players[player_id]
                continue

            # Check for collisions with other snakes
            collision = False
            for other_id, other_player in players.items():
                if other_id != player_id and new_head in other_player['tail']:
                    collision = True
                    break
            if collision:
                socketio.emit('game_over', {'player_id': player_id}, namespace='/')
                for tail_part in player["tail"]:
                    trusts[f"{tail_part['x']} {tail_part['y']}"] = "wall"
                del players[player_id]
                continue

            player['tail'].insert(0, new_head)
            if len(player['tail']) > player['length']:
                player['tail'].pop()

            player['x'] = new_head['x']
            player['y'] = new_head['y']

            # Check for apple collision
            for apple in apples:
                if player['x'] == apple['x'] and player['y'] == apple['y']:
                    player['length'] += 1
                    apples.remove(apple)
                    apples.append(spawn_apple())

            if f"{player['x']} {player['y']}" in trusts.keys():
                if trusts[f"{player['x']} {player['y']}"] != "":
                    player['length'] += 1
                    trusts[f"{player['x']} {player['y']}"] = ""

        daples = deepcopy(apples)
        for tra in trusts.keys():
            if trusts[tra] != "":
                tr = tra.split(" ")
                daples.append({"x": tr[0], "y": tr[1]})

        socketio.emit('update', {'players': players, 'apples': daples}, namespace='/')
        time.sleep(0.1)


@app.route('/')
def index():
    return render_template('index.html')


@socketio.on('connect')
def handle_connect():
    emit('connected', {'msg': 'Connected to server'})


@socketio.on('join')
def handle_join(data):
    player_id = data['player_id']
    players[player_id] = {'x': random.randint(0, 29), 'y': random.randint(0, 19), 'direction': 'RIGHT', 'length': 1,
                          'tail': [], 'color': random_color()}
    join_room(player_id)
    if len(apples) == 0:
        apples.append(spawn_apple())
    emit('player_joined', {'player_id': player_id}, broadcast=True)


@socketio.on('move')
def handle_move(data):
    player_id = data['player_id']
    direction = data['direction']
    if player_id in players:
        players[player_id]['direction'] = direction


@socketio.on('disconnect')
def handle_disconnect():
    player_id = request.sid
    if player_id in players:
        del players[player_id]
        leave_room(player_id)
        emit('player_left', {'player_id': player_id}, broadcast=True)


if __name__ == '__main__':
    game_thread = Thread(target=update_game_state)
    game_thread.start()
    socketio.run(app, debug=True, host="0.0.0.0", port=80)
