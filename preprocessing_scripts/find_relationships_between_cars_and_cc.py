import csv
import time
import datetime
import pandas as pd
import json
from pathlib import Path

bufferMinutes = 20
speed_threshold = 20
distance_threshold = 0.220
minutesGap = 0.5
frequency_threshold = 10
cc_car_mapping = {}

path_of_project_folder = Path(__file__).parent.parent.resolve().as_posix()
cc_data = pd.read_csv("./MC2/cc_data.csv", encoding='utf-8')
cc_loyalty_frequency_data = pd.read_csv("./pre_processed_data/cc_loyalty_frequency_data.csv", encoding='utf-8').to_dict('records')
car_cc_loyalty_frequency_data = []
cc_used_with_car = set()
cc_loyalty_one_to_one_mapping = []

with open('./pre_processed_data/time_stationaryCars_mapping_speed={}_distance={}_minutesGap={}.json'.format(speed_threshold, distance_threshold, minutesGap), 'r', encoding="utf-8") as file:
    json_data = file.read()
    stationary_cars_data = json.loads(json_data)

temp_data = {"timestamp":"01/06/2014 07:52", "location":"Brew've Been Served", "price":"32.83", "last4ccnum":"9405"}
temp_df = pd.DataFrame(temp_data, index=[0])

def run():
    i = 0
    for index, row in cc_data.iterrows():
        cc_location = row['location']
        cc_id = row['last4ccnum']
        current_timestamp = datetime.datetime.strptime(row['timestamp'], '%m/%d/%Y %H:%M')
        visited_cars = set()
        for delta in range(-1*bufferMinutes, 1):
            new_timestamp= current_timestamp + datetime.timedelta(minutes=delta)
            day = str(new_timestamp.day)
            hour = str(new_timestamp.hour)
            minute = str(new_timestamp.minute)
        
            if day in stationary_cars_data:
                if hour in stationary_cars_data[day]:
                    if minute in stationary_cars_data[day][hour]:
                        stopped_cars_at_timestamp = stationary_cars_data[day][hour][minute]
                    else:
                        continue
                else:
                    continue
            else:
                continue

            for car in stopped_cars_at_timestamp:
                if car in visited_cars:
                    continue
                for stop in stopped_cars_at_timestamp[car]:
                    # print("car = {}, location = {}, cc = {}, cc_loca = {}".format(car, stop['location'], cc_id, cc_location))
                    if stop['location'] == cc_location:
                        visited_cars.add(car)
                        if not car in cc_car_mapping:
                            cc_car_mapping[car] = {}
                        if not cc_id in cc_car_mapping[car]:
                            cc_car_mapping[car][cc_id] = 0
                        cc_car_mapping[car][cc_id] += 1
                        break

def merge_with_cc_loyalty_data():
    cc_link_fre = {}

    with open(path_of_project_folder+'/pre_processed_data/car_cc_mapping_bufferMinutes={}_speed={}_distance={}_minutesGap={}.json'.format(bufferMinutes, speed_threshold, distance_threshold, minutesGap)) as json_file:
        car_cc_mapping = json.load(json_file)
    for car_id in car_cc_mapping:
        max_frequency = 1
        for cc_id in car_cc_mapping[car_id]:
            max_frequency = max(max_frequency, car_cc_mapping[car_id][cc_id])
        # print("cc={}_max={}".format(cc_id, max_frequency))
        for cc_id in car_cc_mapping[car_id]:
            if car_cc_mapping[car_id][cc_id] >= min(frequency_threshold, max_frequency):
                car_cc_loyalty_frequency_data.append({"cc_num":car_id, "loyalty_num":cc_id, "frequency":car_cc_mapping[car_id][cc_id]})
                cc_used_with_car.add(int(cc_id))

    for row in cc_loyalty_frequency_data:
        if row['cc_num'] not in cc_link_fre:
            cc_link_fre[row['cc_num']] = 0
        cc_link_fre[row['cc_num']] += 1
    
    for row in cc_loyalty_frequency_data:
        if row['cc_num'] in cc_used_with_car or cc_link_fre[row['cc_num']] > 1:
            car_cc_loyalty_frequency_data.append({"cc_num":row['cc_num'], "loyalty_num":row['loyalty_num'], "frequency":row['frequency']})
        else:
            cc_loyalty_one_to_one_mapping.append({"cc_num":row['cc_num'], "loyalty_num":row['loyalty_num'], "frequency":row['frequency']})


def write_merged_frequency_data_into_csv():
    with open(path_of_project_folder+'/pre_processed_data/sankey_chart_data(car_cc_loyalty_frequency).csv', 'w+', newline='') as fp2:
        dict_writer = csv.DictWriter(fp2, car_cc_loyalty_frequency_data[0].keys())
        dict_writer.writeheader()
        dict_writer.writerows(car_cc_loyalty_frequency_data)
    
    with open(path_of_project_folder+'/pre_processed_data/cc_loyalty_one_to_one_mapping.csv', 'w+', newline='') as fp3:
        dict_writer = csv.DictWriter(fp3, cc_loyalty_one_to_one_mapping[0].keys())
        dict_writer.writeheader()
        dict_writer.writerows(cc_loyalty_one_to_one_mapping)


def write_data_into_files():
    with open(path_of_project_folder+'/pre_processed_data/car_cc_mapping_bufferMinutes={}_speed={}_distance={}_minutesGap={}.json'.format(bufferMinutes, speed_threshold, distance_threshold, minutesGap), 'w+') as fp1:
        json.dump(cc_car_mapping, fp1)
    
if __name__ == '__main__':
    # run()
    # write_data_into_files()
    merge_with_cc_loyalty_data()
    write_merged_frequency_data_into_csv()
