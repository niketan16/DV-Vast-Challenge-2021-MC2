import csv
import time
import geopy.distance
import datetime
from geopy.exc import GeocoderTimedOut
# import haversine as hs
import pandas as pd
import json
from pathlib import Path

minutesGap = 0.5
speed_threshold = 20
distance_threshold = 0.220
car_gps_mapping = {}
car_status_for_each_minute = {} # [id][day][hour][minute][status] = 'moving' OR 'stationary' OR 'missing'
time_stationaryCars_mapping = {}  # [day][hour][minute][id] = array of dictionaries where each dictionary has info of 'Timestamp', 'id', 'lat', 'long'. Here we will store the infromation of stationary cars for each minute of each day.
stationaryCars_location_time_mapping = []
missingCars_location_time_mapping = []

data = pd.read_csv("./MC2/gps.csv", encoding="utf-8")
with open('./preprocessing_scripts/location_coordinate.json', 'r', encoding="utf-8") as file:
    json_data = file.read()
    building_coordinate = json.loads(json_data)

def find_distance_between_two_points(point1, point2, attempt=1, max_attempts=6):
    try:
        return geopy.distance.geodesic(point1, point2).km
    except GeocoderTimedOut:
        if attempt <= max_attempts:
            time.sleep(1.1*attempt)
            return find_distance_between_two_points(point1, point2, attempt=attempt+1)
        raise

def findLocationFromLatLong(lat, long):
    for cordinate in building_coordinate:
        # cordinate['range'][0] is top left point
        # cordinate['range'][1] is bottom right point
        # cordinate['range'][x][1] is lat
        # cordinate['range'][x][0] is long
        # lat value decreases as you go down (just like Y-axis)
        # long value increases as you go right (just like X-axis)
        if lat <= cordinate['range'][0][1] and long >= cordinate['range'][0][0] and lat >= cordinate['range'][1][1] and long <= cordinate['range'][1][0]:
            return cordinate['name']
    return "None"

def run():
    i = 0
    pre_row = {}

    for index, row in data.iterrows():
        car_id = row['id']
        if not car_id in car_gps_mapping:
            car_gps_mapping[car_id] = []
        car_gps_mapping[car_id].append(row)

    for car_id in car_gps_mapping.keys():
        car_status_for_each_minute[car_id] = {}
        time_difference = 0
        distance = 0

        for row in car_gps_mapping[car_id]:
            if not car_id in pre_row:
                pre_row[car_id] = row
                continue

            prev_row = pre_row[car_id]
            prev_cordinates = (prev_row['lat'], prev_row['long'])
            current_cordinates = (row['lat'], row['long'])
            prev_timestamp = datetime.datetime.strptime(prev_row['Timestamp'], '%m/%d/%Y %H:%M:%S')
            current_timestamp = datetime.datetime.strptime(row['Timestamp'], '%m/%d/%Y %H:%M:%S')
            
            if time_difference < (minutesGap * 60):
                time_difference += max((current_timestamp - prev_timestamp).total_seconds(), 0.8)
                distance += find_distance_between_two_points(prev_cordinates, current_cordinates)
            else:
                add_data(row, current_timestamp, car_id, time_difference, distance)
                time_difference = 0
                distance = 0

            pre_row[car_id] = row


def add_data(row, current_timestamp, car_id, time_difference, distance):
    day = current_timestamp.day
    hour = current_timestamp.hour
    minute = current_timestamp.minute

    if not day in car_status_for_each_minute[car_id]:
        car_status_for_each_minute[car_id][day] = {}
    if not hour in car_status_for_each_minute[car_id][day]:
        car_status_for_each_minute[car_id][day][hour] = {}
    if not minute in car_status_for_each_minute[car_id][day][hour]:
        car_status_for_each_minute[car_id][day][hour][minute] = {"moving":0, "stationary":0, "missing":0, "status":""}

    time_difference_hours = (time_difference / 3600)
    speed_kmph = distance / time_difference_hours
    # print('speed={},  distance={},  time={}'.format(speed_kmph, distance, time_difference))
    # decide the status of the car for this gps entry (for this second)
    if speed_kmph > speed_threshold: #moving
        value = car_status_for_each_minute[car_id][day][hour][minute]['moving']
        car_status_for_each_minute[car_id][day][hour][minute]['moving'] = value + 1
        # print("moving")
    elif distance < distance_threshold: #stationary
        value = car_status_for_each_minute[car_id][day][hour][minute]['stationary']
        car_status_for_each_minute[car_id][day][hour][minute]['stationary'] = value + 1

        if not day in time_stationaryCars_mapping:
            time_stationaryCars_mapping[day] = {}
        if not hour in time_stationaryCars_mapping[day]:
            time_stationaryCars_mapping[day][hour] = {}
        if not minute in time_stationaryCars_mapping[day][hour]:
            time_stationaryCars_mapping[day][hour][minute] = {}
        if not car_id in time_stationaryCars_mapping[day][hour][minute]:
            time_stationaryCars_mapping[day][hour][minute][car_id] = []

        location_name = findLocationFromLatLong(float(row['lat']), float(row['long']))
        row_dict = row.to_dict()
        row_dict['location'] = location_name
        time_stationaryCars_mapping[day][hour][minute][car_id].append(row_dict)
        stationaryCars_location_time_mapping.append({"car_id":car_id, "lat":row['lat'], "long":row['long'], "Timestamp":row['Timestamp'], "location":location_name})
        # print("stationary")
    else: #missing
        value = car_status_for_each_minute[car_id][day][hour][minute]['missing']
        car_status_for_each_minute[car_id][day][hour][minute]['missing'] = value + 1
        location_name = findLocationFromLatLong(float(row['lat']), float(row['long']))
        missingCars_location_time_mapping.append({"car_id":car_id, "lat":row['lat'], "long":row['long'], "Timestamp":row['Timestamp'], "location":location_name})
        # print("missing")

    # decide the status of the car for the whole minute
    if car_status_for_each_minute[car_id][day][hour][minute]['moving'] >= car_status_for_each_minute[car_id][day][hour][minute]['stationary']:
        if car_status_for_each_minute[car_id][day][hour][minute]['moving'] > car_status_for_each_minute[car_id][day][hour][minute]['missing']:
            car_status_for_each_minute[car_id][day][hour][minute]['status'] = "moving"
        else:
            car_status_for_each_minute[car_id][day][hour][minute]['status'] = "missing"
    else:
        if car_status_for_each_minute[car_id][day][hour][minute]['stationary'] > car_status_for_each_minute[car_id][day][hour][minute]['missing']:
            car_status_for_each_minute[car_id][day][hour][minute]['status'] = "stationary"
        else:
            car_status_for_each_minute[car_id][day][hour][minute]['status'] = "missing"
                
def old_run():
        i = 0
        pre_row = {}

        for index, row in data.iterrows():
            car_id = row['id']
            if not car_id in car_gps_mapping:
                car_gps_mapping[car_id] = []
            car_gps_mapping[car_id].append(row)

        for row in car_gps_mapping[car_id]:
            if not car_id in pre_row:
                pre_row[car_id] = row
                continue

            prev_row = pre_row[car_id]
            current_timestamp = datetime.datetime.strptime(row['Timestamp'], '%m/%d/%Y %H:%M:%S')
            day = current_timestamp.day
            hour = current_timestamp.hour
            minute = current_timestamp.minute

            if not day in car_status_for_each_minute[car_id]:
                car_status_for_each_minute[car_id][day] = {}
            if not hour in car_status_for_each_minute[car_id][day]:
                car_status_for_each_minute[car_id][day][hour] = {}
            if not minute in car_status_for_each_minute[car_id][day][hour]:
                car_status_for_each_minute[car_id][day][hour][minute] = {"moving":0, "stationary":0, "missing":0, "status":""}

            prev_timestamp = datetime.datetime.strptime(prev_row['Timestamp'], '%m/%d/%Y %H:%M:%S')

            prev_cordinates = (prev_row['lat'], prev_row['long'])
            current_cordinates = (row['lat'], row['long'])

            distance = find_distance_between_two_points(prev_cordinates, current_cordinates)
            time_difference = max((current_timestamp - prev_timestamp).total_seconds(), 0.8)

            speed_kmph = distance / (time_difference / 3600)

            # decide the status of the car for this gps entry (for this second)
            if time_difference < 30 and speed_kmph > 10: #moving
                value = car_status_for_each_minute[car_id][day][hour][minute]['moving']
                car_status_for_each_minute[car_id][day][hour][minute]['moving'] = value + 1
                # print("moving")
            elif distance < 0.120: #stationary
                value = car_status_for_each_minute[car_id][day][hour][minute]['stationary']
                car_status_for_each_minute[car_id][day][hour][minute]['stationary'] = value + 1

                if not day in time_stationaryCars_mapping:
                    time_stationaryCars_mapping[day] = {}
                if not hour in time_stationaryCars_mapping[day]:
                    time_stationaryCars_mapping[day][hour] = {}
                if not minute in time_stationaryCars_mapping[day][hour]:
                    time_stationaryCars_mapping[day][hour][minute] = {}
                if not car_id in time_stationaryCars_mapping[day][hour][minute]:
                    time_stationaryCars_mapping[day][hour][minute][car_id] = []

                location_name = findLocationFromLatLong(float(row['lat']), float(row['long']))
                row_dict = row.to_dict()
                row_dict['location'] = location_name
                time_stationaryCars_mapping[day][hour][minute][car_id].append(row_dict)
                stationaryCars_location_time_mapping.append({"car_id":car_id, "lat":row['lat'], "long":row['long'], "Timestamp":row['Timestamp'], "location":location_name})
            else: #missing
                value = car_status_for_each_minute[car_id][day][hour][minute]['missing']
                car_status_for_each_minute[car_id][day][hour][minute]['missing'] = value + 1
                # print("missing")

            # decide the status of the car for the whole minute
            if car_status_for_each_minute[car_id][day][hour][minute]['moving'] >= car_status_for_each_minute[car_id][day][hour][minute]['stationary']:
                if car_status_for_each_minute[car_id][day][hour][minute]['moving'] > car_status_for_each_minute[car_id][day][hour][minute]['missing']:
                    car_status_for_each_minute[car_id][day][hour][minute]['status'] = "moving"
                else:
                    car_status_for_each_minute[car_id][day][hour][minute]['status'] = "missing"
            else:
                if car_status_for_each_minute[car_id][day][hour][minute]['stationary'] > car_status_for_each_minute[car_id][day][hour][minute]['missing']:
                    car_status_for_each_minute[car_id][day][hour][minute]['status'] = "stationary"
                else:
                    car_status_for_each_minute[car_id][day][hour][minute]['status'] = "missing"

            pre_row[car_id] = row
            # j += 1

def write_data_into_files():
    path_of_project_folder = Path(__file__).parent.parent.resolve().as_posix()
    with open(path_of_project_folder+'/pre_processed_data/car_status_for_each_minute_speed={}_distance={}_minutesGap={}.json'.format(speed_threshold, distance_threshold, minutesGap), 'w+') as fp1:
        json.dump(car_status_for_each_minute, fp1)

    with open(path_of_project_folder+'/pre_processed_data/time_stationaryCars_mapping_speed={}_distance={}_minutesGap={}.json'.format(speed_threshold, distance_threshold, minutesGap), 'w+') as fp2:
        json.dump(time_stationaryCars_mapping, fp2)

    with open(path_of_project_folder+'/pre_processed_data/stationaryCars_location_time_mapping_speed={}_distance={}_minutesGap={}.csv'.format(speed_threshold, distance_threshold, minutesGap), 'w+', newline='') as fp3:
        dict_writer = csv.DictWriter(fp3, stationaryCars_location_time_mapping[0].keys())
        dict_writer.writeheader()
        dict_writer.writerows(stationaryCars_location_time_mapping)

    with open(path_of_project_folder+'/pre_processed_data/missingCars_location_time_mapping_speed={}_distance={}_minutesGap={}.csv'.format(speed_threshold, distance_threshold, minutesGap), 'w+', newline='') as fp4:
        dict_writer = csv.DictWriter(fp4, missingCars_location_time_mapping[0].keys())
        dict_writer.writeheader()
        dict_writer.writerows(missingCars_location_time_mapping)

if __name__ == '__main__':
    run()
    write_data_into_files()