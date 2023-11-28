import csv
import time
import geopy.distance
import datetime
from geopy.exc import GeocoderTimedOut
# import haversine as hs
import pandas as pd
import json
from pathlib import Path

day_car_gps_mapping = {}
path_of_project_folder = Path(__file__).parent.parent.resolve().as_posix()
data = pd.read_csv('gps.csv', encoding="utf-8")

def run():
    for index, row in data.iterrows():
        current_timestamp = datetime.datetime.strptime(row['Timestamp'], '%m/%d/%Y %H:%M:%S')
        day = current_timestamp.day
        car_id = row['id']

        if not day in day_car_gps_mapping:
            day_car_gps_mapping[day] = {}
        if not car_id in day_car_gps_mapping[day]:
            day_car_gps_mapping[day][car_id] = []

        day_car_gps_mapping[day][car_id].append(row.to_dict())

def write_data_into_files():
    with open(path_of_project_folder+'day_car_gps_mapping.json', 'w+', newline='') as fp1:
        json.dump(day_car_gps_mapping, fp1)

if __name__ == '__main__':
    run()
    write_data_into_files()