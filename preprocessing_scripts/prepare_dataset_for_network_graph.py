import csv
import time
import datetime
import pandas as pd
import json
from pathlib import Path


speed_threshold = 20
distance_threshold = 0.220
minutesGap = 0.5

path_of_project_folder = Path(__file__).parent.parent.resolve().as_posix()
stationary_car_data = pd.read_csv("./pre_processed_data/stationaryCars_location_time_mapping_speed={}_distance={}_minutesGap={}.csv".format(speed_threshold, distance_threshold, minutesGap), encoding='utf-8')

stationary_car_data = stationary_car_data[['car_id', 'location']].drop_duplicates()
stationary_car_data = stationary_car_data.drop(stationary_car_data[~stationary_car_data['location'].apply(lambda x: isinstance(x, str))].index)

nodes = []
carNodes = []
locationNodes = []
i=1
cars = stationary_car_data['car_id']
cars = set(cars)

# load car-assignment csv
cardf = pd.read_csv("./MC2/car-assignments.csv", encoding='utf-8')

lname  =list(cardf['LastName'])[:40]
fname  =list(cardf['FirstName'])[:40]
emptitle  =list(cardf['CurrentEmploymentTitle'])[:40]
emptype  =list(cardf['CurrentEmploymentType'])[:40]

empgrpDict = {}
for i,title in enumerate(set(emptype)):
    empgrpDict[title] = i+1

i=0
id_dict={}
for car in cars:
  nodes.append({"id":i,"name":car, "group":empgrpDict[emptype[i]], 'employmentType': emptype[i], "employmentTitle": emptitle[i] , "lastname": lname[i],  "firstname" :fname[i]})
  id_dict[car] = i
  i=i+1


places = stationary_car_data['location']
places = set(places)

for place in places:
  nodes.append({"id":i,"name":place, "group":0})
  id_dict[place] = i
  i=i+1

links = []
for index, row in stationary_car_data.iterrows():
    links.append({"source":id_dict[row['car_id']],"target":id_dict[row['location']]})

network_graph = {"nodes":nodes,"links":links}
import json
with open("./MC2/network-plot.json", "w") as outfile:
    json.dump(network_graph, outfile)