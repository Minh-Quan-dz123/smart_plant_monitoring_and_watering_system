package com.example.project_iot_auto_watering.ui.home

import android.app.Dialog
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.SearchView
import android.widget.Toast
import androidx.fragment.app.DialogFragment
import com.example.project_iot_auto_watering.databinding.FragmentDialogAddCropsBinding
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import androidx.core.graphics.drawable.toDrawable
import androidx.lifecycle.ViewModelProvider
import androidx.room.util.query
import com.example.project_iot_auto_watering.MainViewModel
import com.example.project_iot_auto_watering.MainViewModelFactory
import com.example.project_iot_auto_watering.data.repository.MainRepository
import com.example.project_iot_auto_watering.data.retrofit.RetrofitInstance
import com.example.project_iot_auto_watering.ui.login.viewmodel.AuthViewModel
import com.example.project_iot_auto_watering.ui.login.viewmodel.AuthViewModelFactory

class FragmentDialogCrops(
    private val listener: OnClickDialog
) : DialogFragment() {
    private var _binding: FragmentDialogAddCropsBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: ArrayAdapter<String>
    private lateinit var listNameCrops: List<String>
    private lateinit var listIdCrops: List<Int>
    private lateinit var viewModelMain: MainViewModel
    private val mainRepository = MainRepository(RetrofitInstance.api)

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        _binding = FragmentDialogAddCropsBinding.inflate(layoutInflater)
        viewModelMain =
            ViewModelProvider(
                requireActivity(),
                MainViewModelFactory(mainRepository)
            )[MainViewModel::class.java]
        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setView(binding.root)
            .create()

//        val metrics = resources.displayMetrics
//        val width = (metrics.widthPixels * 0.95).toInt()
//        val height = (metrics.heightPixels * 0.8).toInt()

        //tắt chế độ dismiss khi bấm bên ngoài dialog
        isCancelable = false

        dialog.window?.setLayout(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )
//        dialog.window?.setBackgroundDrawable(Color.TRANSPARENT.toDrawable())

        binding.imgClose.setOnClickListener {
            dismiss()
        }

        binding.imgAdd.setOnClickListener {
            listener.onClickIconAdd()
        }

        initAdapterListCrops()
        setupSearchView()

        return dialog
    }


    private fun initAdapterListCrops() {
        listNameCrops = viewModelMain.listPlants.map { plant -> plant.name }
        listIdCrops = viewModelMain.listPlants.map { plant -> plant.id }
        Log.d("api/getAllPlant", "$listNameCrops")
        //danh sách tạm thời
//        listCrops = listOf("Tomato", "Apple", "Orange", "Cabbage", "Potato", "Okra")
        adapter = ArrayAdapter(requireContext(), android.R.layout.simple_list_item_1, listNameCrops)

        binding.rcvListCrops.adapter = adapter
        binding.rcvListCrops.setOnItemClickListener { parent, view, position, id ->
            val item = listNameCrops[position]
            val idPlant=listIdCrops[position]
            Log.d("ClickItem", "Bạn vừa bấm item $position")
            listener.onClickItemCrop(item,idPlant)
            dismiss()
        }

    }

    private fun setupSearchView() {
        binding.searchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextChange(query: String?): Boolean {
                adapter.filter.filter(query)
                return true
            }

            override fun onQueryTextSubmit(newText: String?): Boolean {
                adapter.filter.filter(newText)
                return true
            }
        })
    }
}


interface OnClickDialog {
    fun onClickIconAdd()
    fun onClickItemCrop(nameCrops: String,id:Int)
}