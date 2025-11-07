import mysql.connector
import os

from dotenv import load_dotenv



# Initialize dotenv
# allows us to us the enviroment varibales
load_dotenv()

dataBase = mysql.connector.connect(
	host = os.environ.get('DB_HOST'),
	user = os.environ.get('DATABASE_USER'),
	passwd = os.environ.get('DATABASE_PASS'),
	)


#prepare cursor object (using the connector declare above)
cursorObject = dataBase.cursor() 

#create data base
cursorObject.execute("CREATE DATABASE zLyrics")

#Message in console to see if it worked 
print("Hello data base i hope it work")